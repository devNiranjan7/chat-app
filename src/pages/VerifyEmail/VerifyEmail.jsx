import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext.jsx";
import sendVerification from "../../lib/sendVerification.js";
import "./VerifyEmail.css";

const RESEND_COOLDOWN_SECONDS = 60;
const POLL_INTERVAL_MS = 5000;

const VerifyEmail = () => {
    const { user, refreshVerification, logout } = useContext(AppContext);
    const [cooldown, setCooldown] = useState(0);
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        if (cooldown <= 0) {
            return;
        }
        const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    useEffect(() => {
        const check = () => {
            if (document.visibilityState === "visible") {
                refreshVerification().catch(() => {});
            }
        };
        const timer = setInterval(check, POLL_INTERVAL_MS);
        window.addEventListener("focus", check);
        document.addEventListener("visibilitychange", check);
        return () => {
            clearInterval(timer);
            window.removeEventListener("focus", check);
            document.removeEventListener("visibilitychange", check);
        };
    }, [refreshVerification]);

    const handleResend = async () => {
        if (cooldown > 0 || sending || !user) {
            return;
        }
        setSending(true);
        try {
            await sendVerification(user);
            toast.success("Verification email sent");
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (error) {
            console.error("Failed to send verification email:", error);
            toast.error(
                error.code === "auth/too-many-requests"
                    ? "Too many requests. Please wait a few minutes and try again."
                    : "Could not send the email. Please try again.",
            );
        } finally {
            setSending(false);
        }
    };

    const handleCheck = async () => {
        if (checking) {
            return;
        }
        setChecking(true);
        try {
            const verified = await refreshVerification();
            if (!verified) {
                toast.info(
                    "Not verified yet. Open the link in the email first.",
                );
            }
        } catch (error) {
            console.error("Failed to check verification:", error);
            toast.error("Could not check right now. Please try again.");
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = async () => {
        if (loggingOut) {
            return;
        }
        setLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
            toast.error(error.message || "Failed to logout");
            setLoggingOut(false);
        }
    };

    return (
        <div className="verify">
            <div className="verify-card">
                <h2>Verify your email</h2>
                <p>
                    We sent a verification link to{" "}
                    <strong>{user?.email}</strong>. Open it, then come back
                    here. This page continues on its own once you're verified.
                </p>
                <p className="verify-hint">
                    Can't find it? Check your spam folder.
                </p>
                <button type="button" onClick={handleCheck} disabled={checking}>
                    {checking ? "Checking..." : "I've verified"}
                </button>
                <button
                    type="button"
                    className="verify-secondary"
                    onClick={handleResend}
                    disabled={cooldown > 0 || sending}
                >
                    {sending
                        ? "Sending..."
                        : cooldown > 0
                          ? `Resend email (${cooldown}s)`
                          : "Resend email"}
                </button>
                <p className="verify-logout" onClick={handleLogout}>
                    {loggingOut ? "Logging out..." : "Use a different account"}
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
