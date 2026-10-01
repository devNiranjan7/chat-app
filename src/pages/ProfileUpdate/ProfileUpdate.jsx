import { useContext, useEffect, useState } from "react";
import assets from "../../assets/assets.js";
import "./ProfileUpdate.css";
import { AppContext } from "../../context/AppContext.jsx";
import { toast } from "react-toastify";
import uploadToCloudinary from "../../lib/uploadToCloudinary.js";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase.js";
import { useNavigate } from "react-router-dom";

const ProfileUpdate = () => {
    const { user, userData } = useContext(AppContext);
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
    if (!image) {
        setPreviewUrl("");
        return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
}, [image]);

    useEffect(() => {
        if (userData) {
            setName(userData.username || "");
            setBio(userData.bio || "");
        }
    }, [userData]);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("User not found");
            return;
        }
        try {
            let imageUrl = userData.profileImage || "";
            if (image) {
                imageUrl = await uploadToCloudinary(image);
            }
            await updateDoc(doc(db, "users", user.uid), {
                username: name,
                bio: bio,
                profileImage: imageUrl,
            });
            toast.success("Profile updated successfully");
            setTimeout(() => {
                navigate("/chat");
            }, 500);
            setImage(null);
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to update profile");
        }
    };

    return (
        <div className="profile">
            <div className="profile-container">
                <form onSubmit={onSubmitHandler}>
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
                                previewUrl || userData?.profileImage || assets.avatar_icon
                            }
                            alt="avatar"
                        />
                        upload profile image
                    </label>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Write profile bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    ></textarea>
                    <button type="submit">Save</button>
                </form>
                <img
                    className="logo"
                    src={
                        previewUrl || userData?.profileImage || assets.logo_icon
                    }
                    alt="logo"
                />
            </div>
        </div>
    );
};

export default ProfileUpdate;
