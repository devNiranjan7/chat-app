import ChatBox from "../../components/ChatBox/ChatBox.jsx";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar/RightSidebar.jsx";
import "./Chat.css";

const Chat = () => {
    return (
        <div className="chat">
            <div className="chat-container">
                <LeftSidebar />
                <ChatBox />
                <RightSidebar />
            </div>
        </div>
    );
};

export default Chat;
