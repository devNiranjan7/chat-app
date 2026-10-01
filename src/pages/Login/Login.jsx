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

const Login = () => {
    const [currState, setCurrState] = useState("Login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            if (currState === "Sign up") {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password,
                );
                await updateProfile(userCredential.user, {
                    displayName: username,
                });
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    username: username,
                    email: email,
                    profileImage: "",
                    bio: "",
                    friends: [],
                });
                toast.success("Account created successfully");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Login successful");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            toast.error("Enter you email first");
            return;
        }
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
                        onClick={handleForgotPassword}
                    >
                        Forgot Password?
                    </p>
                )}
                <button type="submit">
                    {currState === "Sign up" ? "Create Account" : "Login now"}
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
