import { useState } from "react";
import assets from "../../assets/assets.js";
import "./ProfileUpdate.css";

const ProfileUpdate = () => {
    const [image, setImage] = useState(false);

    return (
        <div className="profile">
            <div className="profile-container">
                <form>
                    <h3>Profile Details</h3>
                    <label htmlFor="avatar">
                        <input
                            onChange={(e) => setImage(e.target.files[0])}
                            type="file"
                            id="avatar"
                            accept=".png,.jpg,.jpeg"
                            hidden
                        />
                        <img
                            src={
                                image
                                    ? URL.createObjectURL(image)
                                    : assets.avatar_icon
                            }
                            alt="avatar"
                        />
                        upload profile image
                    </label>
                    <input type="text" placeholder="Your name" required />
                    <textarea placeholder="Write profile bio"></textarea>
                    <button type="submit">Save</button>
                </form>
                <img
                    className="logo"
                    src={image ? URL.createObjectURL(image) : assets.logo_icon}
                    alt="logo"
                />
            </div>
        </div>
    );
};

export default ProfileUpdate;
