import { useContext, useEffect, useRef, useState } from "react";
import assets from "../../assets/assets.js";
import "./ChatBox.css";
import { AppContext } from "../../context/AppContext.jsx";
import getChatId from "../../lib/getChatId.js";
import {
    addDoc,
    collection,
    doc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    writeBatch,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";
import { toast } from "react-toastify";
import uploadToCloudinary from "../../lib/uploadToCloudinary.js";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

const ChatBox = ({
    selectedFriend,
    setSelectedFriend,
    setShowProfile,
    messages,
    setMessages,
    chat,
}) => {
    const { user, userData } = useContext(AppContext);
    const [message, setMessage] = useState("");
    const uid = user?.uid;
    const friendId = selectedFriend?.id;
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [now, setNow] = useState(Date.now());
    const chatMessagesRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const canEdit = (msg) =>
        msg.senderId === uid &&
        !msg.deleted &&
        !msg.image &&
        !!msg.createdAt?.toMillis &&
        now - msg.createdAt.toMillis() < EDIT_WINDOW_MS;

    const friendReadAt = chat?.lastReadAt?.[friendId]?.toMillis?.() ?? 0;
    const friendDeliveredAt = Math.max(
        chat?.deliveredAt?.[friendId]?.toMillis?.() ?? 0,
        friendReadAt,
    );
    const getStatus = (msg) => {
        const t = msg.createdAt?.toMillis?.();
        if (!t) {
            return "sending";
        }
        if (friendReadAt >= t) {
            return "seen";
        }
        if (friendDeliveredAt >= t) {
            return "delivered";
        }
        return "sent";
    };

    const [tabVisible, setTabVisible] = useState(
        document.visibilityState === "visible",
    );
    const markedRef = useRef("");

    useEffect(() => {
        const onChange = () =>
            setTabVisible(document.visibilityState === "visible");
        document.addEventListener("visibilitychange", onChange);
        return () => document.removeEventListener("visibilitychange", onChange);
    }, []);

    useEffect(() => {
        markedRef.current = "";
    }, [friendId]);

    useEffect(() => {
        if (!uid || !friendId || !tabVisible) {
            return;
        }
        const lastFriendMsg = [...messages]
            .reverse()
            .find((m) => m.senderId === friendId);
        if (!lastFriendMsg?.createdAt?.toMillis) {
            return;
        }
        const unreadCount = chat?.unread?.[uid] ?? 0;
        const lastRead = chat?.lastReadAt?.[uid]?.toMillis?.() ?? 0;
        if (
            unreadCount === 0 &&
            lastRead >= lastFriendMsg.createdAt.toMillis()
        ) {
            return;
        }
        const key = `${friendId}:${lastFriendMsg.id}`;
        if (markedRef.current === key) {
            return;
        }
        markedRef.current = key;
        updateDoc(doc(db, "chats", getChatId(uid, friendId)), {
            [`unread.${uid}`]: 0,
            [`lastReadAt.${uid}`]: serverTimestamp(),
        }).catch((error) => {
            console.error("Failed to mark as read:", error);
        });
    }, [messages, chat, uid, friendId, tabVisible]);

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop =
                chatMessagesRef.current.scrollHeight;
        }
    };

    const startEdit = (msg) => {
        setEditingId(msg.id);
        setMessage(msg.text);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setMessage("");
    };

    useEffect(() => {
        setMessages([]);
        if (!uid || !friendId) {
            return;
        }
        const chatId = getChatId(uid, friendId);
        const chatRef = doc(db, "chats", chatId);
        let unsubscribeMessages = null;
        let cancelled = false;
        const initializeChat = async () => {
            try {
                await setDoc(
                    chatRef,
                    { participants: [uid, friendId].sort() },
                    { merge: true },
                );
                if (cancelled) {
                    return;
                }
                const messagesQuery = query(
                    collection(chatRef, "messages"),
                    orderBy("createdAt", "asc"),
                );
                unsubscribeMessages = onSnapshot(
                    messagesQuery,
                    (snapshot) => {
                        setMessages(
                            snapshot.docs.map((messageDoc) => ({
                                id: messageDoc.id,
                                ...messageDoc.data(),
                            })),
                        );
                    },
                    (error) => {
                        console.error("Messages listener error:", error);
                        toast.error("Failed to load messages");
                    },
                );
            } catch (error) {
                console.error("Chat initialization error:", error);
                toast.error("Failed to initialize chat");
            }
        };
        initializeChat();
        return () => {
            cancelled = true;
            if (unsubscribeMessages) {
                unsubscribeMessages();
            }
        };
    }, [uid, friendId, setMessages]);

    useEffect(() => {
        setEditingId(null);
        setMessage("");
    }, [friendId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        if (!user?.uid || !selectedFriend?.id) {
            toast.error("Please select a friend");
            e.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be smaller than 5 MB");
            e.target.value = "";
            return;
        }
        if (sending) {
            e.target.value = "";
            return;
        }
        setSending(true);
        try {
            const imageUrl = await uploadToCloudinary(file);
            const chatId = getChatId(user.uid, selectedFriend.id);
            const chatRef = doc(db, "chats", chatId);
            const messagesRef = collection(chatRef, "messages");
            await addDoc(messagesRef, {
                senderId: user.uid,
                text: "",
                image: imageUrl,
                createdAt: serverTimestamp(),
            });
            await updateDoc(chatRef, {
                lastMessage: "📷 Image",
                lastMessageTime: serverTimestamp(),
                [`unread.${selectedFriend.id}`]: increment(1),
            });
            toast.success("Image sent!");
        } catch (error) {
            console.error("Failed to send image:", error);
            toast.error("Failed to send image");
        } finally {
            setSending(false);
            e.target.value = "";
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            return;
        }
        if (!user?.uid) {
            toast.error("User not authenticated");
            return;
        }
        if (!selectedFriend?.id) {
            toast.error("Please select a friend");
            return;
        }
        if (sending) {
            return;
        }
        const chatId = getChatId(user.uid, selectedFriend.id);
        const chatRef = doc(db, "chats", chatId);
        if (editingId) {
            const original = messages.find((m) => m.id === editingId);
            const newText = message.trim();
            if (
                !original ||
                original.deleted ||
                original.senderId !== user.uid ||
                original.image ||
                newText === original.text
            ) {
                cancelEdit();
                return;
            }
            if (!canEdit(original)) {
                toast.error("Messages can only be edited for 15 minutes");
                cancelEdit();
                return;
            }
            setSending(true);
            try {
                const batch = writeBatch(db);
                batch.update(doc(chatRef, "messages", editingId), {
                    text: newText,
                    edited: true,
                    editedAt: serverTimestamp(),
                });
                if (messages[messages.length - 1]?.id === editingId) {
                    batch.update(chatRef, { lastMessage: newText });
                }
                await batch.commit();
                cancelEdit();
            } catch (error) {
                console.error("Failed to edit message:", error);
                toast.error(
                    error.code === "permission-denied"
                        ? "Messages can only be edited for 15 minutes"
                        : "Failed to edit message",
                );
            } finally {
                setSending(false);
            }
            return;
        }
        setSending(true);
        try {
            await addDoc(collection(chatRef, "messages"), {
                senderId: user.uid,
                text: message.trim(),
                image: "",
                createdAt: serverTimestamp(),
            });
            await updateDoc(chatRef, {
                lastMessage: message.trim(),
                lastMessageTime: serverTimestamp(),
                [`unread.${selectedFriend.id}`]: increment(1),
            });
            setMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };
    const handleDeleteMessage = async (msg) => {
        if (!user?.uid || !selectedFriend?.id || sending) {
            return;
        }
        if (msg.senderId !== user.uid || msg.deleted) {
            return;
        }
        if (!window.confirm("Delete this message for everyone?")) {
            return;
        }
        if (editingId === msg.id) {
            cancelEdit();
        }
        setSending(true);
        try {
            const chatId = getChatId(user.uid, selectedFriend.id);
            const chatRef = doc(db, "chats", chatId);
            const batch = writeBatch(db);
            batch.update(doc(chatRef, "messages", msg.id), {
                text: "",
                image: "",
                deleted: true,
                deletedAt: serverTimestamp(),
            });
            if (messages[messages.length - 1]?.id === msg.id) {
                batch.update(chatRef, { lastMessage: "Message deleted" });
            }
            await batch.commit();
            toast.success("Message deleted");
        } catch (error) {
            console.error("Failed to delete message:", error);
            toast.error("Failed to delete message");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="chat-box">
            <div className="chat-user">
                <button
                    className="back-button"
                    onClick={() => setSelectedFriend(null)}
                >
                    &lt;
                </button>
                <img
                    src={selectedFriend?.profileImage || assets.profile_img}
                    alt="profile"
                />
                <p>
                    {selectedFriend?.username || "Select a friend"}
                    {selectedFriend && (
                        <img
                            className="dot"
                            src={assets.green_dot}
                            alt="green-dot"
                        />
                    )}
                </p>
                <img
                    src={assets.help_icon}
                    className="help"
                    alt="help"
                    onClick={() => setShowProfile(true)}
                />
            </div>
            <div className="chat-msg" ref={chatMessagesRef}>
                {!selectedFriend && (
                    <p className="no-chat">Select a friend to start chatting</p>
                )}
                {selectedFriend &&
                    messages.map((msg) => {
                        const isOwn = msg.senderId === user.uid;
                        return (
                            <div
                                key={msg.id}
                                className={isOwn ? "s-msg" : "r-msg"}
                            >
                                {msg.deleted ? (
                                    <p className="msg deleted-msg">
                                        This message was deleted
                                    </p>
                                ) : msg.image ? (
                                    <img
                                        src={msg.image}
                                        alt="sent"
                                        className="msg-img"
                                        onLoad={scrollToBottom}
                                    />
                                ) : (
                                    <p className="msg">{msg.text}</p>
                                )}
                                <div>
                                    <img
                                        src={
                                            isOwn
                                                ? userData?.profileImage ||
                                                  assets.profile_img
                                                : selectedFriend.profileImage ||
                                                  assets.profile_img
                                        }
                                        alt="profile"
                                    />
                                    <p>
                                        {msg.createdAt?.toDate
                                            ? msg.createdAt
                                                  .toDate()
                                                  .toLocaleTimeString([], {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                            : ""}
                                        {isOwn && !msg.deleted && (
                                            <span
                                                className={`msg-status ${getStatus(msg)}`}
                                                title={getStatus(msg)}
                                            >
                                                {" "}
                                                {getStatus(msg) === "sending"
                                                    ? "…"
                                                    : getStatus(msg) === "sent"
                                                      ? "✓"
                                                      : "✓✓"}
                                            </span>
                                        )}
                                        {msg.edited && !msg.deleted && (
                                            <span className="edited-label">
                                                {" "}
                                                · edited
                                            </span>
                                        )}
                                        {canEdit(msg) && (
                                            <span
                                                className="msg-edit"
                                                onClick={() => startEdit(msg)}
                                            >
                                                {" "}
                                                Edit
                                            </span>
                                        )}
                                        {isOwn && !msg.deleted && (
                                            <span
                                                className="msg-delete"
                                                onClick={() =>
                                                    handleDeleteMessage(msg)
                                                }
                                            >
                                                {" "}
                                                Delete
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
            </div>
            <div className="chat-input">
                {editingId && (
                    <div className="editing-bar">
                        <span>Editing message</span>
                        <button type="button" onClick={cancelEdit}>
                            Cancel
                        </button>
                    </div>
                )}
                <input
                    type="text"
                    className={editingId ? "editing" : ""}
                    placeholder={
                        selectedFriend ? "Send a message" : "Select a friend"
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSendMessage();
                        } else if (e.key === "Escape" && editingId) {
                            cancelEdit();
                        }
                    }}
                    disabled={!selectedFriend || sending}
                />
                <input
                    type="file"
                    id="image"
                    accept="image/png,image/jpeg"
                    hidden
                    disabled={!selectedFriend || sending || !!editingId}
                    onChange={handleImageChange}
                />
                <label htmlFor="image">
                    <img src={assets.gallery_icon} alt="gallery" />
                </label>
                <img
                    src={assets.send_button}
                    alt="send"
                    onClick={handleSendMessage}
                    className={
                        selectedFriend ? "send-button" : "send-button disabled"
                    }
                />
            </div>
        </div>
    );
};

export default ChatBox;