import { useContext, useEffect, useState } from "react";
import assets from "../../assets/assets.js";
import "./LeftSidebar.css";
import { useNavigate } from "react-router-dom";
import { db } from "../../config/firebase.js";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext.jsx";
import getChatId from "../../lib/getChatId.js";
import {
    desktopSupported,
    enableDesktopAlerts,
    playNotificationSound,
    setNotificationSetting,
    useNotificationSettings,
} from "../../lib/notifications.js";
import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import DeleteAccountModal from "../DeleteAccountModal/DeleteAccountModal.jsx";

const LeftSidebar = ({
    selectedFriend,
    setSelectedFriend,
    chats = {},
    presence = {},
}) => {
    const { user, userData, logout } = useContext(AppContext);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showMenu, setShowMenu] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [loadingRequest, setLoadingRequest] = useState(null);
    const [processingRequest, setProcessingRequest] = useState(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const navigate = useNavigate();
    const notificationSettings = useNotificationSettings();
    const desktopAvailable = desktopSupported();
    const desktopActive =
        desktopAvailable &&
        notificationSettings.desktop &&
        Notification.permission === "granted";

    const handleToggleSound = () => {
        const next = !notificationSettings.sound;
        setNotificationSetting("sound", next);
        if (next) {
            playNotificationSound({ force: true });
        }
    };

    const handleToggleDesktop = async () => {
        if (!desktopAvailable) {
            toast.info(
                "This browser can't show desktop notifications. You'll see in-app alerts instead.",
            );
            return;
        }
        if (desktopActive) {
            setNotificationSetting("desktop", false);
            return;
        }
        const permission = await enableDesktopAlerts();
        setNotificationSetting("desktop", permission === "granted");
        if (permission === "granted") {
            toast.success("Desktop alerts are on");
        } else if (permission === "denied") {
            toast.error(
                "Notifications are blocked. Allow them in your browser's site settings, then try again.",
            );
        } else {
            toast.info("Desktop alerts were not enabled");
        }
    };

    useEffect(() => {
        const usersRef = collection(db, "users");
        const unsubscribe = onSnapshot(
            usersRef,
            (snapshot) => {
                const users = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setAllUsers(users);
            },
            (error) => {
                console.error("Users listener error:", error);
                setAllUsers([]);
                toast.error("Failed to load users");
            },
        );
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedFriend) return;
        const updatedFriend = allUsers.find(
            (item) => item.id === selectedFriend.id,
        );
        if (
            updatedFriend &&
            (updatedFriend.username !== selectedFriend.username ||
                updatedFriend.bio !== selectedFriend.bio ||
                updatedFriend.profileImage !== selectedFriend.profileImage)
        ) {
            setSelectedFriend(updatedFriend);
        }
    }, [allUsers, selectedFriend, setSelectedFriend]);

    useEffect(() => {
        if (!user?.uid) {
            setFriendRequests([]);
            return;
        }
        const requestsRef = collection(db, "friendRequests");
        const requestsQuery = query(
            requestsRef,
            where("receiverId", "==", user.uid),
        );
        const unsubscribe = onSnapshot(
            requestsQuery,
            (snapshot) => {
                const requests = snapshot.docs
                    .map((requestDoc) => ({
                        id: requestDoc.id,
                        ...requestDoc.data(),
                    }))
                    .filter((request) => request.status === "pending");
                setFriendRequests(requests);
            },
            (error) => {
                console.error("Friend request listener error:", error);
                setFriendRequests([]);
                toast.error("Failed to load friend requests");
            },
        );
        return () => unsubscribe();
    }, [user]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (!value.trim()) {
            setSearchResults([]);
            return;
        }
        const results = allUsers.filter(
            (item) =>
                item.id !== user?.uid &&
                item.username?.toLowerCase().includes(value.toLowerCase()),
        );
        setSearchResults(results);
    };

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await logout();
            setShowMenu(false);
            toast.success("Logged out successfully!");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error(error.message || "Failed to logout");
        } finally {
            setLoggingOut(false);
        }
    };

    const handleSendRequest = async (friendId) => {
        if (!user?.uid) {
            toast.error("User not authenticated");
            return;
        }
        if (loadingRequest === friendId) {
            return;
        }
        const currentFriends = userData?.friends || [];
        if (currentFriends.includes(friendId)) {
            toast.info("Already friends");
            return;
        }
        setLoadingRequest(friendId);
        try {
            const requestId = `${user.uid}_${friendId}`;
            const requestRef = doc(db, "friendRequests", requestId);
            const existingRequest = await getDoc(requestRef);
            if (
                existingRequest.exists() &&
                existingRequest.data().status === "pending"
            ) {
                toast.info("Friend request already sent");
                return;
            }
            const reverseRequestId = `${friendId}_${user.uid}`;
            const reverseRequestRef = doc(
                db,
                "friendRequests",
                reverseRequestId,
            );
            const reverseRequest = await getDoc(reverseRequestRef);
            if (
                reverseRequest.exists() &&
                reverseRequest.data().status === "pending"
            ) {
                const batch = writeBatch(db);
                const currentUserRef = doc(db, "users", user.uid);
                const otherUserRef = doc(db, "users", friendId);
                batch.update(currentUserRef, {
                    friends: arrayUnion(friendId),
                });
                batch.update(otherUserRef, {
                    friends: arrayUnion(user.uid),
                });
                batch.update(reverseRequestRef, {
                    status: "accepted",
                });
                await batch.commit();
                toast.success("You are now friends!");
                return;
            }
            await setDoc(requestRef, {
                senderId: user.uid,
                receiverId: friendId,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            toast.success("Friend request sent!");
        } catch (error) {
            console.error("Failed to send friend request:", error);
            toast.error("Failed to send friend request");
        } finally {
            setLoadingRequest(null);
        }
    };

    const handleAcceptRequest = async (request) => {
        if (!user?.uid) {
            toast.error("User not authenticated");
            return;
        }
        if (processingRequest === request.id) {
            return;
        }
        setProcessingRequest(request.id);
        try {
            const batch = writeBatch(db);
            const currentUserRef = doc(db, "users", user.uid);
            const senderRef = doc(db, "users", request.senderId);
            const requestRef = doc(db, "friendRequests", request.id);
            batch.update(currentUserRef, {
                friends: arrayUnion(request.senderId),
            });
            batch.update(senderRef, {
                friends: arrayUnion(user.uid),
            });
            batch.update(requestRef, {
                status: "accepted",
            });
            await batch.commit();
            toast.success("Friend request accepted!");
        } catch (error) {
            console.error("Failed to accept friend request:", error);
            toast.error("Failed to accept friend request");
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleRejectRequest = async (request) => {
        if (!user?.uid) {
            toast.error("User not authenticated");
            return;
        }
        if (processingRequest === request.id) {
            return;
        }
        setProcessingRequest(request.id);
        try {
            await updateDoc(doc(db, "friendRequests", request.id), {
                status: "rejected",
            });
            toast.success("Friend request rejected");
        } catch (error) {
            console.error("Failed to reject friend request:", error);
            toast.error("Failed to reject friend request");
        } finally {
            setProcessingRequest(null);
        }
    };

    const friends = allUsers.filter((item) =>
        userData?.friends?.includes(item.id),
    );

    return (
        <div className="ls">
            <div className="ls-top">
                <div className="ls-nav">
                    <img src={assets.logo} className="logo" alt="logo" />
                    <div className="menu">
                        <img
                            src={assets.menu_icon}
                            alt="menu"
                            onClick={() => setShowMenu(!showMenu)}
                        />
                        {showMenu && (
                            <div className="sub-menu">
                                <p
                                    onClick={() => {
                                        setShowMenu(false);
                                        navigate("/profile");
                                    }}
                                >
                                    Edit Profile
                                </p>
                                <hr />
                                <p onClick={handleToggleSound}>
                                    Sound:{" "}
                                    {notificationSettings.sound ? "On" : "Off"}
                                </p>
                                <hr />
                                <p onClick={handleToggleDesktop}>
                                    Desktop alerts:{" "}
                                    {!desktopAvailable
                                        ? "Unavailable"
                                        : desktopActive
                                          ? "On"
                                          : "Off"}
                                </p>
                                <hr />
                                <p onClick={handleLogout}>
                                    {loggingOut ? "Logging out..." : "Logout"}
                                </p>
                                <hr />
                                <p
                                    className="menu-danger"
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowDeleteAccount(true);
                                    }}
                                >
                                    Delete account
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="ls-search">
                    <img src={assets.search_icon} alt="search" />
                    <input
                        type="text"
                        placeholder="Search here.."
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
                {searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map((item) => {
                            const isFriend = userData?.friends?.includes(
                                item.id,
                            );
                            return (
                                <div className="search-user" key={item.id}>
                                    <img
                                        src={
                                            item.profileImage ||
                                            assets.profile_img
                                        }
                                        alt="profile"
                                    />
                                    <div>
                                        <p>{item.username}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSendRequest(item.id)
                                        }
                                        disabled={
                                            isFriend ||
                                            loadingRequest === item.id
                                        }
                                    >
                                        {isFriend
                                            ? "Friends"
                                            : loadingRequest === item.id
                                              ? "Sending..."
                                              : "Add"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="ls-list">
                {friendRequests.map((request) => {
                    const sender = allUsers.find(
                        (item) => item.id === request.senderId,
                    );
                    if (!sender) {
                        return null;
                    }
                    const processing = processingRequest === request.id;
                    return (
                        <div className="friend-request" key={request.id}>
                            <img
                                src={sender.profileImage || assets.profile_img}
                                alt="profile"
                            />
                            <div>
                                <p>{sender.username}</p>
                                <span>Friend request</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAcceptRequest(request)}
                                disabled={processing}
                            >
                                {processing ? "..." : "Accept"}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRejectRequest(request)}
                                disabled={processing}
                            >
                                {processing ? "..." : "Reject"}
                            </button>
                        </div>
                    );
                })}
                {friends.map((item) => {
                    const unread =
                        chats[getChatId(user.uid, item.id)]?.unread?.[
                            user.uid
                        ] ?? 0;
                    return (
                        <div
                            key={item.id}
                            className={`friends ${
                                selectedFriend?.id === item.id ? "selected" : ""
                            }`}
                            onClick={() => setSelectedFriend(item)}
                        >
                            <img
                                src={item.profileImage || assets.profile_img}
                                alt="profile"
                            />
                            <div>
                                <p>
                                    {item.username}
                                    {presence[item.id]?.online && (
                                        <span
                                            className="presence-dot"
                                            title="Online"
                                        />
                                    )}
                                </p>
                                <span>{item.bio || "Hey There!"}</span>
                            </div>
                            {unread > 0 && selectedFriend?.id !== item.id && (
                                <span className="unread-badge">
                                    {unread > 9 ? "9+" : unread}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            {showDeleteAccount && (
                <DeleteAccountModal
                    onClose={() => setShowDeleteAccount(false)}
                    onStart={() => setSelectedFriend(null)}
                />
            )}
        </div>
    );
};

export default LeftSidebar;
