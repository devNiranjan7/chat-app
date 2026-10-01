import { useContext, useEffect, useState } from "react";
import assets from "../../assets/assets.js";
import "./LeftSidebar.css";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase.js";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext.jsx";
import {
    arrayUnion,
    collection,
    doc,
    getDocs,
    writeBatch,
} from "firebase/firestore";

const LeftSidebar = ({ selectedFriend, setSelectedFriend }) => {
    const { user, userData } = useContext(AppContext);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showMenu, setShowMenu] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const snapshot = await getDocs(collection(db, "users"));
                const users = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setAllUsers(users);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load users");
            }
        };
        loadUsers();
    }, []);

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearch(value);
        if (!value.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const results = allUsers.filter(
                (item) =>
                    item.id !== user.uid &&
                    (item.username
                        ?.toLowerCase()
                        .includes(value.toLowerCase()) ||
                        item.email?.toLowerCase().includes(value.toLowerCase)),
            );
            setSearchResults(results);
        } catch (error) {
            console.error(error);
            toast.error("Failed to search users");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setShowMenu(false);
            toast.success("Logged out successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to logout");
        }
    };

    const handleAddFriend = async (friendId) => {
        if (!user) {
            return;
        }
        const currentFriends = userData?.friends || [];
        if (currentFriends.includes(friendId)) {
            toast.info("Already friends");
            return;
        }
        try {
            const batch = writeBatch(db);
            const currentUserRef = doc(db, "users", user.uid);
            const friendUserRef = doc(db, "users", friendId);
            batch.update(currentUserRef, { friends: arrayUnion(friendId) });
            batch.update(friendUserRef, { friends: arrayUnion(user.uid) });
            await batch.commit();
            toast.success("Friend added successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add friend");
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
                                <p onClick={handleLogout}>Logout</p>
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
                                        onClick={() => handleAddFriend(item.id)}
                                        disabled={isFriend}
                                    >
                                        {isFriend ? "Added" : "Add"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="ls-list">
                {friends.map((item) => (
                    <div
                        key={item.id}
                        className={`friends ${selectedFriend?.id === item.id ? "selected" : ""}`}
                        onClick={() => setSelectedFriend(item)}
                    >
                        <img
                            src={item.profileImage || assets.profile_img}
                            alt="profile"
                        />
                        <div>
                            <p>{item.username}</p>
                            <span>{item.bio || "Hey There!"}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeftSidebar;
