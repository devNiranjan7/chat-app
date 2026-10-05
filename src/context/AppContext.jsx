import { onAuthStateChanged, signOut } from "firebase/auth";
import { createContext, useCallback, useEffect, useState } from "react";
import { auth, db } from "../config/firebase.js";
import {
    disableNetwork,
    doc,
    enableNetwork,
    onSnapshot,
} from "firebase/firestore";
import { markOffline, usePresence } from "../lib/presence.js";

export const AppContext = createContext();

const ensureVerifiedToken = async (currentUser) => {
    const { claims } = await currentUser.getIdTokenResult();
    if (claims.email_verified === true) {
        return;
    }
    await currentUser.getIdToken(true);
    await disableNetwork(db);
    await enableNetwork(db);
};

const AppContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [emailVerified, setEmailVerified] = useState(false);

    usePresence(user && emailVerified ? user.uid : null);

    useEffect(() => {
        let unsubscribeUserData = () => {};
        let runId = 0;
        const unsubscribeAuth = onAuthStateChanged(
            auth,
            async (currentUser) => {
                const myRun = ++runId;
                unsubscribeUserData();
                unsubscribeUserData = () => {};
                if (currentUser?.emailVerified) {
                    try {
                        await ensureVerifiedToken(currentUser);
                    } catch (error) {
                        console.warn("Token refresh failed:", error);
                    }
                    if (myRun !== runId) {
                        return;
                    }
                }
                setUser(currentUser);
                setEmailVerified(!!currentUser?.emailVerified);
                if (currentUser) {
                    unsubscribeUserData = onSnapshot(
                        doc(db, "users", currentUser.uid),
                        (snapshot) => {
                            setUserData(
                                snapshot.exists() ? snapshot.data() : null,
                            );
                        },
                        (error) => {
                            console.error("User data listener error:", error);
                            setUserData(null);
                        },
                    );
                } else {
                    setUserData(null);
                }
                setLoading(false);
            },
        );
        return () => {
            runId += 1;
            unsubscribeAuth();
            unsubscribeUserData();
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
        await ensureVerifiedToken(current);
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
