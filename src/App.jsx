import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login/Login.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import ProfileUpdate from "./pages/ProfileUpdate/ProfileUpdate.jsx";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail.jsx";
import { ToastContainer } from "react-toastify";
import { useContext } from "react";
import { AppContext } from "./context/AppContext.jsx";

const App = () => {
    const { user, loading, emailVerified } = useContext(AppContext);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    const home = !user ? "/" : emailVerified ? "/chat" : "/verify-email";

    const protectedPage = (page) => {
        if (!user) {
            return <Navigate to="/" replace />;
        }
        if (!emailVerified) {
            return <Navigate to="/verify-email" replace />;
        }
        return page;
    };

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={user ? <Navigate to={home} replace /> : <Login />}
                />
                <Route
                    path="/verify-email"
                    element={
                        !user ? (
                            <Navigate to="/" replace />
                        ) : emailVerified ? (
                            <Navigate to="/chat" replace />
                        ) : (
                            <VerifyEmail />
                        )
                    }
                />
                <Route path="/chat" element={protectedPage(<Chat />)} />
                <Route
                    path="/profile"
                    element={protectedPage(<ProfileUpdate />)}
                />
                <Route path="*" element={<Navigate to={home} replace />} />
            </Routes>
            <ToastContainer />
        </>
    );
};

export default App;
