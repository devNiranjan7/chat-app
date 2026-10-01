import { useContext, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import assets from "../../assets/assets.js";
import { AppContext } from "../../context/AppContext.jsx";
import { auth, db } from "../../config/firebase.js";
import "./RightSidebar.css";
import getChatId from "../../lib/getChatId.js";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

const RightSidebar = ({ selectedFriend, showProfile, setShowProfile }) => {
    const { user } = useContext(AppContext);
    const [media, setMedia] = useState([]);

    useEffect(() => {
        if (!user || !selectedFriend) {
            setMedia([]);
            return;
        }
        const chatId = getChatId(user.uid, selectedFriend.id);
        const messagesRef = collection(db, "chats", chatId, "messages");
        const messagesQuery = query(messagesRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const images = snapshot.docs
                .map((doc) => doc.data())
                .filter((message) => message.image)
                .map((message) => message.image);
            setMedia(images);
        });
        return () => unsubscribe();
    }, [user, selectedFriend]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Logged out successfully!");
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to logout");
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
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default RightSidebar;
