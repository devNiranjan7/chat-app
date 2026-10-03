import { auth } from "../config/firebase.js";

const uploadToCloudinary = async (file) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("You must be logged in to upload");
    }
    const idToken = await user.getIdToken();
    const signResponse = await fetch("/api/sign-upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const sign = await signResponse.json();
    if (!signResponse.ok) {
        throw new Error(sign.error || "Could not get upload permission");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sign.apiKey);
    formData.append("timestamp", sign.timestamp);
    formData.append("signature", sign.signature);
    formData.append("folder", sign.folder);
    formData.append("tags", sign.tags);
    formData.append("allowed_formats", sign.allowedFormats);
    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: formData },
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || "Image upload failed");
    }
    return data.secure_url;
};

export default uploadToCloudinary;
