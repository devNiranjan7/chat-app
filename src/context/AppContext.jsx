import { onAuthStateChanged } from "firebase/auth";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase.js";
import { doc, onSnapshot } from "firebase/firestore";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUserData = () => {};
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                unsubscribeUserData = onSnapshot(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setUserData(snapshot.data());
                    }
                });
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

    const value = {
        user,
        loading,
        userData,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
