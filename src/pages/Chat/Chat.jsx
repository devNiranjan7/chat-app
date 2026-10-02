import { useState } from "react";
import ChatBox from "../../components/ChatBox/ChatBox.jsx";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar/RightSidebar.jsx";
import "./Chat.css";

const Chat = () => {
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [messages, setMessages] = useState([]);

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
                />
                <ChatBox
                    selectedFriend={selectedFriend}
                    setSelectedFriend={setSelectedFriend}
                    setShowProfile={setShowProfile}
                    messages={messages}
                    setMessages={setMessages}
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