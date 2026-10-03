import { useEffect } from "react";
import {
    onDisconnect,
    onValue,
    push,
    ref,
    remove,
    serverTimestamp,
    set,
} from "firebase/database";
import { auth, rtdb } from "../config/firebase.js";

export const usePresence = (uid) => {
    useEffect(() => {
        if (!uid) {
            return;
        }
        const connectedRef = ref(rtdb, ".info/connected");
        const connectionsRef = ref(rtdb, `status/${uid}/connections`);
        const lastOnlineRef = ref(rtdb, `status/${uid}/lastOnline`);
        let myConnection = null;
        const unsubscribe = onValue(connectedRef, async (snapshot) => {
            if (snapshot.val() !== true) {
                return;
            }
            const connection = push(connectionsRef);
            myConnection = connection;
            try {
                await onDisconnect(connection).remove();
                await onDisconnect(lastOnlineRef).set(serverTimestamp());
                await set(connection, true);
            } catch (error) {
                console.warn("Presence update failed:", error.code || error);
            }
        });
        return () => {
            unsubscribe();
            if (myConnection) {
                remove(myConnection).catch(() => {});
            }
        };
    }, [uid]);
};

export const markOffline = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
        return;
    }
    try {
        await set(ref(rtdb, `status/${uid}`), {
            lastOnline: serverTimestamp(),
        });
    } catch (error) {
        console.warn("Failed to mark offline:", error.code || error);
    }
};

export const subscribeToPresence = (userIds, onChange) => {
    const unsubscribers = userIds.map((userId) =>
        onValue(
            ref(rtdb, `status/${userId}`),
            (snapshot) => {
                const value = snapshot.val();
                onChange(userId, {
                    online:
                        !!value?.connections &&
                        Object.keys(value.connections).length > 0,
                    lastOnline:
                        typeof value?.lastOnline === "number"
                            ? value.lastOnline
                            : 0,
                });
            },
            (error) => {
                console.error("Presence listener error:", error);
            },
        ),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
};

export const formatLastSeen = (ms) => {
    if (!ms) {
        return "";
    }
    const date = new Date(ms);
    const time = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
        return `Last seen today at ${time}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return `Last seen yesterday at ${time}`;
    }
    const day = date.toLocaleDateString([], { day: "numeric", month: "short" });
    return `Last seen ${day} at ${time}`;
};
