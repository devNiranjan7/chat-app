import { useContext, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import assets from "../../assets/assets.js";
import { AppContext } from "../../context/AppContext.jsx";
import { auth, db } from "../../config/firebase.js";
import "./RightSidebar.css";
import getChatId from "../../lib/getChatId.js";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

const RightSidebar = ({ selectedFriend, showProfile, setShowProfile }) => {
    const { user } = useContext(AppContext);
    const [media, setMedia] = useState([]);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        if (!user || !selectedFriend) {
            setMedia([]);
            return;
        }
        const chatId = getChatId(user.uid, selectedFriend.id);
        const chatRef = doc(db, "chats", chatId);
        let unsubscribeChat = null;
        let unsubscribeMessages = null;
        unsubscribeChat = onSnapshot(
            chatRef,
            (chatSnapshot) => {
                if (!chatSnapshot.exists()) {
                    setMedia([]);
                    return;
                }
                if (unsubscribeChat) {
                    unsubscribeChat();
                    unsubscribeChat = null;
                }
                if (unsubscribeMessages) {
                    return;
                }
                const messagesQuery = query(
                    collection(db, "chats", chatId, "messages"),
                    orderBy("createdAt", "desc"),
                );
                unsubscribeMessages = onSnapshot(
                    messagesQuery,
                    (snapshot) => {
                        const images = snapshot.docs
                            .map((messageDoc) => messageDoc.data())
                            .filter((message) => message.image)
                            .map((message) => message.image);

                        setMedia(images);
                    },
                    (error) => {
                        console.error("Media messages listener error:", error);
                        toast.error("Failed to load media");
                    },
                );
            },
            (error) => {
                console.error("Chat listener error:", error);
                toast.error("Failed to initialize media data");
            },
        );
        return () => {
            if (unsubscribeMessages) {
                unsubscribeMessages();
            }
            if (unsubscribeChat) {
                unsubscribeChat();
            }
        };
    }, [user, selectedFriend]);

    const handleLogout = async () => {
        if (loggingOut) {
            return;
        }
        setLoggingOut(true);
        try {
            await signOut(auth);
            toast.success("Logged out successfully!");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error(error.message || "Failed to logout");
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className="rs">
            {showProfile && (
                <button
                    className="rs-back"
                    onClick={() => setShowProfile(false)}
                >
                    &lt;
                </button>
            )}
            {!selectedFriend ? (
                <div className="rs-empty">
                    <p>Select a friend to view their profile</p>
                </div>
            ) : (
                <>
                    <div className="rs-profile">
                        <img
                            src={
                                selectedFriend.profileImage ||
                                assets.profile_img
                            }
                            alt="profile"
                        />
                        <h3>
                            {selectedFriend.username}
                            <img
                                src={assets.green_dot}
                                className="dot"
                                alt="green-dot"
                            />
                        </h3>
                        <p>
                            {selectedFriend.bio ||
                                "Hey there! I am using this chat app."}
                        </p>
                    </div>
                    <hr />
                    <div className="rs-media">
                        <p>Media</p>
                        <div>
                            {media.length > 0 ? (
                                media.map((image, index) => (
                                    <img
                                        key={`${image}-${index}`}
                                        src={image}
                                        alt="shared"
                                        onClick={() =>
                                            window.open(
                                                image,
                                                "_blank",
                                                "noopener,noreferrer",
                                            )
                                        }
                                    />
                                ))
                            ) : (
                                <p className="no-media">No media shared yet</p>
                            )}
                        </div>
                    </div>
                </>
            )}
            <button onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? "Logging out..." : "Logout"}
            </button>
        </div>
    );
};

export default RightSidebar;
