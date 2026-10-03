import { onAuthStateChanged, signOut } from "firebase/auth";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase.js";
import { doc, onSnapshot } from "firebase/firestore";
import { markOffline, usePresence } from "../lib/presence.js";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    usePresence(user?.uid);

    useEffect(() => {
        let unsubscribeUserData = () => {};
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                unsubscribeUserData = onSnapshot(
                    userRef,
                    (snapshot) => {
                        if (snapshot.exists()) {
                            setUserData(snapshot.data());
                        } else {
                            setUserData(null);
                        }
                    },
                    (error) => {
                        console.error("User data listener error:", error);
                        setUserData(null);
                    },
                );
            } else {
                unsubscribeUserData();
                unsubscribeUserData = () => {};
                setUserData(null);
            }
            setLoading(false);
        });
        return () => {
            (unsubscribeAuth(), unsubscribeUserData());
        };
    }, []);

    const logout = async () => {
        await markOffline();
        await signOut(auth);
    };

    const value = {
        user,
        loading,
        userData,
        logout,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
