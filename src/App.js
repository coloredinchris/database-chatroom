import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatRoom from "./pages/ChatRoom";
import './styles/global.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} /> {/* Default route */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/chatroom" element={<ChatRoom />} />
            </Routes>
        </Router>
    );
}

export default App;
