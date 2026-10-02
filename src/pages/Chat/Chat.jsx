import { useContext, useEffect, useRef, useState } from "react";
import {
    collection,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import ChatBox from "../../components/ChatBox/ChatBox.jsx";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar/RightSidebar.jsx";
import { AppContext } from "../../context/AppContext.jsx";
import { db } from "../../config/firebase.js";
import getChatId from "../../lib/getChatId.js";
import "./Chat.css";

const Chat = () => {
    const { user } = useContext(AppContext);
    const uid = user?.uid;
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chats, setChats] = useState({});
    const deliveredMarks = useRef({});

    useEffect(() => {
        if (!uid) {
            setChats({});
            return;
        }
        const chatsQuery = query(
            collection(db, "chats"),
            where("participants", "array-contains", uid),
        );
        const unsubscribe = onSnapshot(
            chatsQuery,
            (snapshot) => {
                const next = {};
                snapshot.docs.forEach((chatDoc) => {
                    next[chatDoc.id] = chatDoc.data();
                });
                setChats(next);
            },
            (error) => {
                console.error("Chats listener error:", error);
            },
        );
        return () => unsubscribe();
    }, [uid]);

    useEffect(() => {
        if (!uid) {
            return;
        }
        Object.entries(chats).forEach(([chatId, chat]) => {
            const unread = chat.unread?.[uid] ?? 0;
            const lastTime = chat.lastMessageTime?.toMillis?.() ?? 0;
            const delivered = chat.deliveredAt?.[uid]?.toMillis?.() ?? 0;
            if (
                unread > 0 &&
                lastTime > delivered &&
                deliveredMarks.current[chatId] !== lastTime
            ) {
                deliveredMarks.current[chatId] = lastTime;
                updateDoc(doc(db, "chats", chatId), {
                    [`deliveredAt.${uid}`]: serverTimestamp(),
                }).catch((error) => {
                    console.error("Failed to mark delivered:", error);
                });
            }
        });
    }, [chats, uid]);

    const selectedChat =
        uid && selectedFriend
            ? chats[getChatId(uid, selectedFriend.id)]
            : undefined;

    return (
        <div className="chat">
            <div
                className={`chat-container ${
                    selectedFriend ? "friend-selected" : ""
                } ${showProfile ? "profile-open" : ""}`}
            >
                <LeftSidebar
                    selectedFriend={selectedFriend}
                    setSelectedFriend={(friend) => {
                        setSelectedFriend(friend);
                        setShowProfile(false);
                    }}
                    chats={chats}
                />
                <ChatBox
                    selectedFriend={selectedFriend}
                    setSelectedFriend={setSelectedFriend}
                    setShowProfile={setShowProfile}
                    messages={messages}
                    setMessages={setMessages}
                    chat={selectedChat}
                />
                <RightSidebar
                    selectedFriend={selectedFriend}
                    showProfile={showProfile}
                    setShowProfile={setShowProfile}
                    messages={messages}
                />
            </div>
        </div>
    );
};

export default Chat;
