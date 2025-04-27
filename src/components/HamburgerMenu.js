import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HamburgerMenu.css";

const HamburgerMenu = ({ menuType = "default", username }) => {
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
        <>
            <div className="hamburger-menu">
                {/* Add the 'active' class when isOpen is true */}
                <button
                    className={`hamburger-icon ${isOpen ? "active" : ""}`}
                    onClick={toggleMenu}
                >
                    ☰
                </button>
                {isOpen && (
                    <div className="menu-dropdown">
                        {menuType === "default" && (
                            <>
                                <button onClick={() => navigate("/login")}>Login</button>
                                <button onClick={() => navigate("/register")}>Register</button>
                                <button onClick={() => navigate("/forgot-password")}>Forgot Password</button>
                            </>
                        )}
                        {menuType === "chatroom" && (
                            <>
                                <button
                                    onClick={() => navigate("/account")}
                                    className="account-button"
                                >
                                    Account Info
                                </button>
                                <button onClick={handleLogout} className="logout-button">Logout</button>
                            </>
                        )}
                        {menuType === "account" && (
                            <>
                                <button
                                    onClick={() => navigate("/chatroom")}
                                    className="back-to-chatroom-button"
                                >
                                    Back to Chatroom
                                </button>
                                <button onClick={handleLogout} className="logout-button">
                                    Logout
                                </button>
                            </>
                        )}
                        {menuType === "manage-users" && (
                            <>
                                <button 
                                    onClick={() => navigate("/account")} 
                                    className="account-button"
                                >
                                    Back to Account
                                </button>
                                <button
                                    onClick={() => navigate("/chatroom")}
                                    className="back-to-chatroom-button"
                                >
                                    Back to Chatroom
                                </button>
                                <button onClick={handleLogout} className="logout-button">
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default HamburgerMenu;