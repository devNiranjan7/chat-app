import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { deleteAccount } from "../../lib/deleteAccount.js";
import "./DeleteAccountModal.css";

const describeError = (error) => {
    switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
            return "Incorrect password.";
        case "auth/too-many-requests":
            return "Too many attempts. Please wait a few minutes and try again.";
        case "auth/requires-recent-login":
            return "For security, please log out, log back in, and try again.";
        case "auth/network-request-failed":
            return "Network problem. Check your connection and try again.";
        default:
            return "Deletion didn't finish. Press Delete account again to continue where it stopped.";
    }
};

const DeleteAccountModal = ({ onClose, onStart }) => {
    const [password, setPassword] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState("");
    const [error, setError] = useState("");

    const canDelete = password.length > 0 && confirmText === "DELETE" && !busy;

    const handleDelete = async () => {
        if (!canDelete) {
            return;
        }
        setBusy(true);
        setError("");
        try {
            const { imagesDeleted } = await deleteAccount({
                password,
                onStart,
                onProgress: setProgress,
            });
            toast.success("Your account has been deleted");
            if (!imagesDeleted) {
                toast.info(
                    "Your account is gone, but some uploaded photos could not be removed from storage.",
                );
            }
        } catch (err) {
            console.error("Account deletion failed:", err);
            setError(describeError(err));
            setProgress("");
            setBusy(false);
        }
    };

    return createPortal(
        <div
            className="delete-overlay"
            onClick={() => {
                if (!busy) {
                    onClose();
                }
            }}
        >
            <div
                className="delete-card"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
            >
                <h3>Delete account</h3>
                <p>
                    This permanently deletes your account, profile, friend
                    connections and <strong>all of your chats</strong>,
                    including the other person's copy of each conversation. The
                    photos you uploaded are removed too. This cannot be undone.
                </p>
                <input
                    type="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={busy}
                />
                <input
                    type="text"
                    placeholder='Type "DELETE" to confirm'
                    value={confirmText}
                    onChange={(event) => setConfirmText(event.target.value)}
                    disabled={busy}
                />
                {error && <p className="delete-error">{error}</p>}
                {busy && <p className="delete-progress">{progress}</p>}
                <div className="delete-actions">
                    <button
                        type="button"
                        className="delete-cancel"
                        onClick={onClose}
                        disabled={busy}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="delete-confirm"
                        onClick={handleDelete}
                        disabled={!canDelete}
                    >
                        {busy ? "Deleting..." : "Delete account"}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default DeleteAccountModal;
