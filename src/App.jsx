import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login/Login.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import ProfileUpdate from "./pages/ProfileUpdate/ProfileUpdate.jsx";
import { ToastContainer } from "react-toastify";
import { useContext } from "react";
import { AppContext } from "./context/AppContext.jsx";

const App = () => {
    const { user, loading } = useContext(AppContext);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={user ? <Navigate to="/chat" /> : <Login />}
                />
                <Route
                    path="/chat"
                    element={user ? <Chat /> : <Navigate to="/" />}
                />
                <Route
                    path="/profile"
                    element={user ? <ProfileUpdate /> : <Navigate to="/" />}
                />
            </Routes>
            <ToastContainer />
        </>
    );
};

export default App;
