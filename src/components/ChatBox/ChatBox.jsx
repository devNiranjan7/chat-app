import assets from "../../assets/assets.js";
import "./ChatBox.css";

const ChatBox = () => {
    return (
        <div className="chat-box">
            <div className="chat-user">
                <img src={assets.profile_img} alt="profile" />
                <p>
                    Tony Stark{" "}
                    <img
                        className="dot"
                        src={assets.green_dot}
                        alt="green-dot"
                    />
                </p>
                <img src={assets.help_icon} className="help" alt="help" />
            </div>
            <div className="chat-msg">
                <div className="s-msg">
                    <p className="msg">
                        Lorem, ipsum dolor sit amet consectetur adipisicing.
                    </p>
                    <div>
                        <img src={assets.profile_img} alt="profile" />
                        <p>7:30 PM</p>
                    </div>
                </div>
                <div className="s-msg">
                    <img src={assets.pic1} alt="pic1" className="msg-img" />
                    <div>
                        <img src={assets.profile_img} alt="profile" />
                        <p>7:30 PM</p>
                    </div>
                </div>
                <div className="r-msg">
                    <p className="msg">
                        Lorem,is a ipsum dolor sit amet consectetur adipisicing.
                    </p>
                    <div>
                        <img src={assets.profile_img} alt="profile" />
                        <p>7:30 PM</p>
                    </div>
                </div>
            </div>
            <div className="chat-input">
                <input type="text" placeholder="Send a message" />
                <input
                    type="file"
                    id="image"
                    accept="image/png,image/jpeg"
                    hidden
                />
                <label htmlFor="image">
                    <img src={assets.gallery_icon} alt="gallery" />
                </label>
                <img src={assets.send_button} alt="send" />
            </div>
        </div>
    );
};

export default ChatBox;
