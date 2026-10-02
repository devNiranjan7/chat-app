import { useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import assets from "../../assets/assets.js";
import { auth } from "../../config/firebase.js";
import "./RightSidebar.css";

const RightSidebar = ({
    selectedFriend,
    showProfile,
    setShowProfile,
    messages = [],
}) => {
    const [loggingOut, setLoggingOut] = useState(false);

    const media = useMemo(
        () =>
            messages
                .filter((message) => message.image)
                .map((message) => message.image)
                .reverse(),
        [messages],
    );

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
