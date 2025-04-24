import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/HamburgerMenu.css";

const HamburgerMenu = ({ menuType = "default" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:5000/logout", {
                method: "POST",
                credentials: "include", // Ensure cookies are sent
            });

            if (response.ok) {
                localStorage.removeItem("username"); // Clear username from localStorage
                navigate("/login"); // Redirect to the login page
            } else {
                console.error("Logout failed:", response.statusText);
            }
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <div className="hamburger-menu">
            <button className="hamburger-icon" onClick={toggleMenu}>
                ☰
            </button>
            {isOpen && (
                <div className="menu-dropdown">
                    {menuType === "default" && (
                        <>
                            <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                            <Link to="/register" onClick={() => setIsOpen(false)}>Register</Link>
                            <Link to="/forgot-password" onClick={() => setIsOpen(false)}>Forgot Password</Link>
                        </>
                    )}
                    {menuType === "chatroom" && (
                        <button onClick={handleLogout} className="logout-button">Logout</button>
                    )}
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;