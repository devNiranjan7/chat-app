import { useContext, useEffect, useRef, useState } from "react";
import assets from "../../assets/assets.js";
import "./ChatBox.css";
import { AppContext } from "../../context/AppContext.jsx";
import getChatId from "../../lib/getChatId.js";
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";
import { toast } from "react-toastify";
import uploadToCloudinary from "../../lib/uploadToCloudinary.js";

const ChatBox = ({ selectedFriend, setSelectedFriend,setShowProfile }) => {
    const { user } = useContext(AppContext);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const chatMessagesRef = useRef(null);

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop =
                chatMessagesRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (!user || !selectedFriend) {
            setMessages([]);
            return;
        }
        const chatId = getChatId(user.uid, selectedFriend.id);
        const chatRef = doc(db, "chats", chatId);
        const createChat = async () => {
            await setDoc(
                chatRef,
                {
                    participants: [user.uid, selectedFriend.id],
                },
                { merge: true },
            );
        };
        createChat();
        const messagesRef = collection(chatRef, "messages");
        const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(messagesData);
        });
        return () => unsubscribe();
    }, [user, selectedFriend]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        if (!user.uid || !selectedFriend.id) {
            toast.error("Please select a friend");
            return;
        }
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
            });
            toast.success("Image sent!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send image");
        }
        e.target.value = "";
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
        try {
            const chatId = getChatId(user.uid, selectedFriend.id);
            const chatRef = doc(db, "chats", chatId);
            const messagesRef = collection(chatRef, "messages");
            await addDoc(messagesRef, {
                senderId: user.uid,
                text: message.trim(),
                image: "",
                createdAt: serverTimestamp(),
            });
            await updateDoc(chatRef, {
                lastMessage: message.trim(),
                lastMessageTime: serverTimestamp(),
            });
            setMessage("");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message");
        }
    };

    return (
        <div className="chat-box">
            <div className="chat-user">
                <button className="back-button" onClick={()=>setSelectedFriend(null)}>&lt;</button>
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
                <img src={assets.help_icon} className="help" alt="help" onClick={() => setShowProfile(true)}/>
            </div>
            <div className="chat-msg" ref={chatMessagesRef}>
                {!selectedFriend && (
                    <p className="no-chat">Select a friend to start chatting</p>
                )}
                {selectedFriend &&
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={
                                message.senderId === user.uid
                                    ? "s-msg"
                                    : "r-msg"
                            }
                        >
                            {message.image ? (
                                <img
                                    src={message.image}
                                    alt="sent"
                                    className="msg-img"
                                    onLoad={scrollToBottom}
                                />
                            ) : (
                                <p className="msg">{message.text}</p>
                            )}
                            <div>
                                <img
                                    src={
                                        message.senderId === user.uid
                                            ? user.photoURL ||
                                              assets.profile_img
                                            : selectedFriend.profileImage ||
                                              assets.profile_img
                                    }
                                    alt="profile"
                                />
                                <p>
                                    {message.createdAt
                                        ?.toDate()
                                        .toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                </p>
                            </div>
                        </div>
                    ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    placeholder={
                        selectedFriend ? "Send a message" : "Select a friend"
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSendMessage();
                        }
                    }}
                    disabled={!selectedFriend}
                />
                <input
                    type="file"
                    id="image"
                    accept="image/png,image/jpeg"
                    hidden
                    disabled={!selectedFriend}
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
