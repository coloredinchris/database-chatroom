import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HamburgerMenu.css";

const HamburgerMenu = ({ menuType = "default", username }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
    const [confirmationInput, setConfirmationInput] = useState("");
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

    const handleDeleteAccount = async () => {
        if (confirmationInput.trim() !== username) {
            alert("Username does not match. Please type your username exactly as it appears.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/delete-user", {
                method: "DELETE",
                credentials: "include", // Ensure cookies are sent
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                localStorage.removeItem("username"); // Clear username from localStorage
                navigate("/register"); // Redirect to the register page
            } else {
                alert(data.error || "Failed to delete account.");
            }
        } catch (err) {
            console.error("An error occurred:", err);
            alert("An error occurred while deleting the account.");
        }
    };

    return (
        <>
            <div className="hamburger-menu">
                <button className="hamburger-icon" onClick={toggleMenu}>
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
                                <button onClick={handleLogout} className="logout-button">Logout</button>
                                <button
                                    onClick={() => setShowDeleteOverlay(true)}
                                    className="delete-account-button"
                                >
                                    Delete Account
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {showDeleteOverlay && (
                <div className="delete-confirmation-overlay">
                    <div className="delete-confirmation">
                        <h3>Confirm Account Deletion</h3>
                        <p>Type your username to confirm:</p>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={confirmationInput}
                            onChange={(e) => setConfirmationInput(e.target.value)}
                        />
                        <button onClick={handleDeleteAccount} className="confirm-delete-button">
                            Confirm Delete
                        </button>
                        <button
                            onClick={() => setShowDeleteOverlay(false)}
                            className="cancel-delete-button"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default HamburgerMenu;