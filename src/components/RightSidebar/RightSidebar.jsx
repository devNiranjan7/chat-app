import assets from "../../assets/assets.js";
import "./RightSidebar.css";

const RightSidebar = () => {
    return (
        <div className="rs">
            <div className="rs-profile">
                <img src={assets.profile_img} alt="profile" />
                <h3>
                    Tony Stark{" "}
                    <img
                        src={assets.green_dot}
                        className="dot"
                        alt="green-dot"
                    />
                </h3>
                <p>Hey there, I am Tony Stark using chat app</p>
            </div>
            <hr />
            <div className="rs-media">
                <p>Media</p>
                <div>
                    <img src={assets.pic1} alt="pic1" />
                    <img src={assets.pic2} alt="pic2" />
                    <img src={assets.pic3} alt="pic3" />
                    <img src={assets.pic4} alt="pic4" />
                    <img src={assets.pic1} alt="pic1" />
                    <img src={assets.pic2} alt="pic2" />
                </div>
            </div>
            <button>Logout</button>
        </div>
    );
};

export default RightSidebar;
