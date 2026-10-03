import { createElement, useEffect, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../config/firebase.js";
import {
    canShowDesktopNotification,
    desktopSupported,
    enableDesktopAlerts,
    getNotificationSettings,
    playNotificationSound,
    setNotificationSetting,
    showDesktopNotification,
    unlockAudio,
} from "./notifications.js";

const PROMPT_FLAG = "notifPromptDismissed";

const readFlag = (key) => {
    try {
        return localStorage.getItem(key) === "1";
    } catch {
        return false;
    }
};

const writeFlag = (key) => {
    try {
        localStorage.setItem(key, "1");
    } catch {
        // storage unavailable: the prompt may show again
    }
};

const shorten = (text, max = 80) =>
    text.length > max ? `${text.slice(0, max)}…` : text;

export const useNotifications = ({
    uid,
    chats,
    chatsLoaded,
    selectedFriendId,
    onOpenChat,
}) => {
    const previousUnread = useRef({});
    const baselineReady = useRef(false);
    const profileCache = useRef({});
    const soundHintShown = useRef(false);
    const openChatRef = useRef(onOpenChat);

    useEffect(() => {
        openChatRef.current = onOpenChat;
    }, [onOpenChat]);

    useEffect(() => {
        const events = ["pointerdown", "keydown", "touchstart"];
        events.forEach((name) => window.addEventListener(name, unlockAudio));
        return () => {
            events.forEach((name) =>
                window.removeEventListener(name, unlockAudio),
            );
        };
    }, []);

    useEffect(() => {
        if (!uid || !desktopSupported()) {
            return;
        }
        if (
            Notification.permission !== "default" ||
            readFlag(PROMPT_FLAG) ||
            !getNotificationSettings().desktop
        ) {
            return;
        }
        const timer = setTimeout(() => {
            toast(
                ({ closeToast }) =>
                    createElement(
                        "div",
                        null,
                        createElement(
                            "p",
                            null,
                            "Turn on desktop notifications for new messages?",
                        ),
                        createElement(
                            "div",
                            {
                                style: {
                                    display: "flex",
                                    gap: "8px",
                                    marginTop: "8px",
                                },
                            },
                            createElement(
                                "button",
                                {
                                    type: "button",
                                    style: {
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: "#077eff",
                                        color: "#fff",
                                        cursor: "pointer",
                                    },
                                    onClick: async () => {
                                        try {
                                            const permission =
                                                await enableDesktopAlerts();
                                            setNotificationSetting(
                                                "desktop",
                                                permission === "granted",
                                            );
                                        } finally {
                                            closeToast();
                                        }
                                    },
                                },
                                "Enable",
                            ),
                            createElement(
                                "button",
                                {
                                    type: "button",
                                    style: {
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #ccc",
                                        background: "#fff",
                                        cursor: "pointer",
                                    },
                                    onClick: closeToast,
                                },
                                "Not now",
                            ),
                        ),
                    ),
                {
                    toastId: "notif-permission",
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false,
                    onClose: () => writeFlag(PROMPT_FLAG),
                },
            );
        }, 3000);
        return () => clearTimeout(timer);
    }, [uid]);

    useEffect(() => {
        previousUnread.current = {};
        baselineReady.current = false;
    }, [uid]);

    const getProfile = async (friendId) => {
        if (profileCache.current[friendId]) {
            return profileCache.current[friendId];
        }
        let profile = { id: friendId, username: "New message" };
        try {
            const snapshot = await getDoc(doc(db, "users", friendId));
            if (snapshot.exists()) {
                profile = { id: friendId, ...snapshot.data() };
            }
        } catch (error) {
            console.warn("Could not load sender profile:", error);
        }
        profileCache.current[friendId] = profile;
        return profile;
    };

    const showToast = (chatId, content, openChat) => {
        const toastId = `msg-${chatId}`;
        if (toast.isActive(toastId)) {
            toast.update(toastId, { render: content, autoClose: 4000 });
        } else {
            toast(content, { toastId, autoClose: 4000, onClick: openChat });
        }
    };

    const notify = async (chatId, chat) => {
        const friendId = (chat.participants ?? []).find((id) => id !== uid);
        if (!friendId) {
            return;
        }
        const visible = document.visibilityState === "visible";
        if (selectedFriendId === friendId && visible) {
            return;
        }
        const settings = getNotificationSettings();
        if (settings.sound) {
            playNotificationSound().then((played) => {
                if (!played && !soundHintShown.current) {
                    soundHintShown.current = true;
                    toast.info(
                        "Your browser is blocking notification sounds. Click anywhere on this page once to enable them.",
                        { toastId: "sound-blocked", autoClose: 8000 },
                    );
                }
            });
        }
        const friend = await getProfile(friendId);
        const name = friend.username || "New message";
        const preview = shorten(chat.lastMessage || "Sent you a message");
        const openChat = () => openChatRef.current?.(friend);
        if (!visible && settings.desktop && canShowDesktopNotification()) {
            showDesktopNotification({
                title: name,
                body: preview,
                icon: friend.profileImage,
                tag: chatId,
                onClick: openChat,
            });
        }
        showToast(chatId, `${name}: ${preview}`, openChat);
    };

    useEffect(() => {
        if (!uid || !chatsLoaded) {
            return;
        }
        const nextUnread = {};
        Object.entries(chats).forEach(([chatId, chat]) => {
            const unread = chat.unread?.[uid] ?? 0;
            nextUnread[chatId] = unread;
            if (!baselineReady.current) {
                return;
            }
            const before = previousUnread.current[chatId] ?? 0;
            if (unread > before) {
                notify(chatId, chat);
            }
        });
        previousUnread.current = nextUnread;
        baselineReady.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats, chatsLoaded, uid, selectedFriendId]);
};
