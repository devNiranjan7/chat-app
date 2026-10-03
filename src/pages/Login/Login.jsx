import { useState } from "react";
import assets from "../../assets/assets.js";
import "./Login.css";
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { auth, db } from "../../config/firebase.js";
import { toast } from "react-toastify";
import { doc, setDoc } from "firebase/firestore";
import sendVerification from "../../lib/sendVerification.js";

const Login = () => {
    const [currState, setCurrState] = useState("Login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            if (currState === "Sign up") {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password,
                );
                await updateProfile(userCredential.user, {
                    displayName: username.trim(),
                });
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    username: username.trim(),
                    profileImage: "",
                    bio: "",
                    friends: [],
                });
                try {
                    await sendVerification(userCredential.user);
                    toast.success(
                        "Account created! Check your email to verify it.",
                    );
                } catch (mailError) {
                    console.error("Verification email failed:", mailError);
                    toast.info(
                        "Account created. We couldn't send the verification email yet, use Resend on the next screen.",
                    );
                }
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Login successful");
            }
        } catch (error) {
            console.error(error);
            switch (error.code) {
                case "auth/email-already-in-use":
                    toast.error("Email is already registered");
                    break;

                case "auth/invalid-email":
                    toast.error("Enter a valid email address");
                    break;

                case "auth/weak-password":
                    toast.error("Password should be at least 6 characters");
                    break;

                case "auth/invalid-credential":
                    toast.error("Invalid email or password");
                    break;

                case "auth/user-not-found":
                    toast.error("No account found with this email");
                    break;

                case "auth/wrong-password":
                    toast.error("Invalid email or password");
                    break;

                default:
                    toast.error("Something went wrong. Please try again");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            toast.error("Enter your email first");
            return;
        }
        if (resetLoading) return;
        setResetLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            toast.success("Password reset email sent!");
        } catch (error) {
            console.error(error);
            if (error.code === "auth/user-not-found") {
                toast.error("No account found with this email");
            } else if (error.code === "auth/invalid-email") {
                toast.error("Enter a valid email address");
            } else {
                toast.error("Failed to send password reset email");
            }
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="login">
            <img src={assets.logo_big} alt="logo" className="logo" />
            <form className="login-form" onSubmit={onSubmitHandler}>
                <h2>{currState}</h2>
                {currState === "Sign up" && (
                    <input
                        type="text"
                        placeholder="Username"
                        className="form-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        maxLength={30}
                    />
                )}
                <input
                    type="email"
                    placeholder="Email Address"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {currState === "Login" && (
                    <p
                        className="forgot-password"
                        onClick={
                            resetLoading ? undefined : handleForgotPassword
                        }
                    >
                        {resetLoading ? "Sending..." : "Forgot Password?"}
                    </p>
                )}
                <button type="submit" disabled={loading}>
                    {loading
                        ? "Please wait..."
                        : currState === "Sign up"
                          ? "Create Account"
                          : "Login now"}
                </button>
                <div className="login-term">
                    <input type="checkbox" required />
                    <p>Agree to the terms of use & privacy policy.</p>
                </div>
                <div className="login-forgot">
                    {currState === "Sign up" ? (
                        <p className="login-toggle">
                            Already have an account{" "}
                            <span onClick={() => setCurrState("Login")}>
                                login here
                            </span>
                        </p>
                    ) : (
                        <p className="login-toggle">
                            Create an account{" "}
                            <span onClick={() => setCurrState("Sign up")}>
                                click here
                            </span>
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Login;
