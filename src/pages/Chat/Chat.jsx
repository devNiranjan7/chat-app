import { useState } from "react";
import ChatBox from "../../components/ChatBox/ChatBox.jsx";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar/RightSidebar.jsx";
import "./Chat.css";

const Chat = () => {
    const [selectedFriend, setSelectedFriend] = useState(null);

    return (
        <div className="chat">
            <div className="chat-container">
                <LeftSidebar
                    selectedFriend={selectedFriend}
                    setSelectedFriend={setSelectedFriend}
                />
                <ChatBox selectedFriend={selectedFriend} />
                <RightSidebar selectedFriend={selectedFriend} />
            </div>
        </div>
    );
};

export default Chat;
