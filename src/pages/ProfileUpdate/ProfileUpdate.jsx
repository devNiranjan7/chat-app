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
    const [loading, setLoading] = useState(false);

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
        if (loading) return;
        setLoading(true);
        try {
            let imageUrl = userData.profileImage || "";
            if (image) {
                imageUrl = await uploadToCloudinary(image);
            }
            await updateDoc(doc(db, "users", user.uid), {
                username: name.trim(),
                bio: bio.trim(),
                profileImage: imageUrl,
            });
            toast.success("Profile updated successfully");
            setImage(null);
            setTimeout(() => {
                navigate("/chat");
            }, 500);
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile">
            <div className="profile-container">
                <form onSubmit={onSubmitHandler}>
                    <h3>Profile Details</h3>
                    <label htmlFor="avatar">
                        <input
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                    toast.error(
                                        "Image must be smaller than 5 MB",
                                    );
                                    e.target.value = "";
                                    return;
                                }
                                setImage(file);
                            }}
                            type="file"
                            id="avatar"
                            accept=".png,.jpg,.jpeg"
                            hidden
                        />
                        <img
                            src={
                                previewUrl ||
                                userData?.profileImage ||
                                assets.avatar_icon
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
                        required maxLength={30}
                    />
                    <textarea
                        placeholder="Write profile bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)} maxLength={300}
                    ></textarea>
                    <button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </button>
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
