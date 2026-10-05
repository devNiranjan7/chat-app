import { onAuthStateChanged, signOut } from "firebase/auth";
import { createContext, useCallback, useEffect, useState } from "react";
import { auth, db } from "../config/firebase.js";
import { disableNetwork, doc, enableNetwork, onSnapshot } from "firebase/firestore";
import { markOffline, usePresence } from "../lib/presence.js";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [emailVerified, setEmailVerified] = useState(false);

    usePresence(user && emailVerified ? user.uid : null);

    useEffect(() => {
        let unsubscribeUserData = () => {};
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setEmailVerified(!!currentUser?.emailVerified);
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

    const refreshVerification = useCallback(async () => {
        const current = auth.currentUser;
        if (!current) {
            return false;
        }
        await current.reload();
        if (!current.emailVerified) {
            return false;
        }
        await current.getIdToken(true);
        await disableNetwork(db);
        await enableNetwork(db);
        setEmailVerified(true);
        return true;
    }, []);

    const logout = async () => {
        await markOffline();
        await signOut(auth);
    };

    const value = {
        user,
        loading,
        userData,
        emailVerified,
        refreshVerification,
        logout,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
