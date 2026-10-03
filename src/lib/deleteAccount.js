import {
    EmailAuthProvider,
    deleteUser,
    reauthenticateWithCredential,
} from "firebase/auth";
import {
    arrayRemove,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    writeBatch,
} from "firebase/firestore";
import { auth, db } from "../config/firebase.js";
import { clearPresence } from "./presence.js";

const WIDE_BATCH = 400;
const LOOKUP_BATCH = 15;
const MAX_ATTEMPTS = 3;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const commitInChunks = async (operations, size, onChunk) => {
    for (let start = 0; start < operations.length; start += size) {
        const chunk = operations.slice(start, start + size);
        for (let attempt = 1; ; attempt += 1) {
            try {
                const batch = writeBatch(db);
                chunk.forEach((run) => run(batch));
                await batch.commit();
                break;
            } catch (error) {
                const transient =
                    error.code === "unavailable" ||
                    error.code === "deadline-exceeded";
                if (!transient || attempt >= MAX_ATTEMPTS) {
                    throw error;
                }
                await wait(500 * attempt);
            }
        }
        onChunk?.(Math.min(start + size, operations.length), operations.length);
    }
};

const deleteUploadedImages = async (user) => {
    try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/delete-images", {
            method: "POST",
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.ok;
    } catch (error) {
        console.warn("Could not delete uploaded images:", error);
        return false;
    }
};

export const deleteAccount = async ({
    password,
    onStart = () => {},
    onProgress = () => {},
}) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("You must be logged in");
    }
    const uid = user.uid;

    onProgress("Checking your password…");
    await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, password),
    );
    onStart();

    onProgress("Collecting your data…");
    const profileRef = doc(db, "users", uid);
    const profileSnap = await getDoc(profileRef);
    const friendIds = profileSnap.exists()
        ? (profileSnap.data().friends ?? [])
        : [];

    const [sentSnap, receivedSnap, chatsSnap] = await Promise.all([
        getDocs(
            query(
                collection(db, "friendRequests"),
                where("senderId", "==", uid),
            ),
        ),
        getDocs(
            query(
                collection(db, "friendRequests"),
                where("receiverId", "==", uid),
            ),
        ),
        getDocs(
            query(
                collection(db, "chats"),
                where("participants", "array-contains", uid),
            ),
        ),
    ]);

    const friendRefs = [];
    for (const friendId of friendIds) {
        const friendRef = doc(db, "users", friendId);
        const friendSnap = await getDoc(friendRef);
        if (
            friendSnap.exists() &&
            (friendSnap.data().friends ?? []).includes(uid)
        ) {
            friendRefs.push(friendRef);
        }
    }

    const requestRefs = new Map();
    [...sentSnap.docs, ...receivedSnap.docs].forEach((requestDoc) => {
        requestRefs.set(requestDoc.ref.path, requestDoc.ref);
    });

    const messageRefs = [];
    for (const chatDoc of chatsSnap.docs) {
        const messagesSnap = await getDocs(collection(chatDoc.ref, "messages"));
        messagesSnap.docs.forEach((messageDoc) =>
            messageRefs.push(messageDoc.ref),
        );
    }

    onProgress("Removing friend requests and connections…");
    const looseEnds = [
        ...[...requestRefs.values()].map(
            (requestRef) => (batch) => batch.delete(requestRef),
        ),
        ...friendRefs.map(
            (friendRef) => (batch) =>
                batch.update(friendRef, { friends: arrayRemove(uid) }),
        ),
    ];
    await commitInChunks(looseEnds, WIDE_BATCH);

    const dataOps = [];
    if (profileSnap.exists()) {
        dataOps.push((batch) => batch.delete(profileRef));
    }
    messageRefs.forEach((messageRef) =>
        dataOps.push((batch) => batch.delete(messageRef)),
    );
    chatsSnap.docs.forEach((chatDoc) =>
        dataOps.push((batch) => batch.delete(chatDoc.ref)),
    );
    onProgress("Deleting your profile and chats…");
    await commitInChunks(dataOps, LOOKUP_BATCH, (done, total) =>
        onProgress(`Deleting your profile and chats… (${done}/${total})`),
    );

    onProgress("Removing your online status…");
    await clearPresence();

    onProgress("Deleting your photos…");
    const imagesDeleted = await deleteUploadedImages(user);

    onProgress("Deleting your login…");
    await deleteUser(user);

    return { imagesDeleted };
};
