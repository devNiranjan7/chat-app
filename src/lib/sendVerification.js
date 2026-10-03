import { sendEmailVerification } from "firebase/auth";

const sendVerification = async (user) => {
    try {
        await sendEmailVerification(user, {
            url: `${window.location.origin}/`,
        });
    } catch (error) {
        if (
            error.code === "auth/unauthorized-continue-uri" ||
            error.code === "auth/invalid-continue-uri"
        ) {
            await sendEmailVerification(user);
            return;
        }
        throw error;
    }
};

export default sendVerification;
