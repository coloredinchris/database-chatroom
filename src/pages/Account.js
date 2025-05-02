import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Account.css";
import HamburgerMenu from "../components/HamburgerMenu";
import useDarkMode from "../hooks/useDarkMode";
import { usernameColorMap } from "../components/ColorUtils";

const readableColors = [
    "#00D0E0", "#00D0F0", "#00E000", "#00E060", "#CBCC32",
    "#99D65B", "#26D8D8", "#DBC1BC", "#EFD175", "#D6D65B"
];

const Account = ({ username }) => {
    const [selectedColor, setSelectedColor] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [isModerator, setIsModerator] = useState(false);
    const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
    const [confirmationInput, setConfirmationInput] = useState("");
    const [darkMode, setDarkMode] = useDarkMode();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch("http://localhost:5000/verify-session", { credentials: "include" });
                const data = await res.json();
                if (res.ok && data.is_moderator) {
                    setIsModerator(true);
                }
            } catch (err) {
                console.error("Error verifying session:", err);
            }
        };
        fetchSession();
    }, []);      

    const handleUsernameChange = async () => {
        if (!newUsername.trim()) {
            alert("Please enter a new username.");
            return;
        }

        const confirmed = window.confirm(`Are you sure you want to change your username to "${newUsername}"? You will be logged out afterward.`);
        if (!confirmed) return;

        try {
            const res = await fetch("http://localhost:5000/change-username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ new_username: newUsername }),
            });

            const data = await res.json();
            if (res.ok) {
                alert("Username updated successfully! You will now be logged out.");

                await fetch("http://localhost:5000/logout", {
                    method: "POST",
                    credentials: "include",
                });

                navigate("/login");
            } else {
                alert(data.error || "Failed to update username.");
            }
        } catch (err) {
            console.error("Username update error:", err);
            alert("Something went wrong.");
        }
    };

    const handleResetPassword = () => {
        navigate("/forgot-password");
    };

    const handleColorChange = async () => {
        try {
            const response = await fetch("http://localhost:5000/update-color", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ color: selectedColor }),
            });

            if (response.ok) {
                alert("Color updated successfully!");
            } else {
                alert("Failed to update color.");
            }
        } catch (err) {
            console.error("Error updating color:", err);
            alert("An error occurred while updating the color.");
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
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                localStorage.removeItem("username");
                navigate("/register");
            } else {
                alert(data.error || "Failed to delete account.");
            }
        } catch (err) {
            console.error("Error deleting account:", err);
            alert("An error occurred while deleting the account.");
        }
    };

    return (
        <div className="account-page">
            <HamburgerMenu 
            menuType="account" 
            username={username} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            />
            <h1>Account Information</h1>

            <div className="color-selection">
                <h3>Change Your Color!</h3>
                <div className="color-options">
                {readableColors.map((color) => {
                const displayColor = darkMode
                    ? usernameColorMap[color]?.dark || color
                    : usernameColorMap[color]?.light || color;

                return (
                    <div
                    key={color}
                    className={`color-box ${selectedColor === color ? "selected" : ""}`}
                    style={{ backgroundColor: displayColor }}
                    onClick={() => setSelectedColor(color)}
                    />
                );
                })}
                </div>
                <button onClick={handleColorChange} disabled={!selectedColor}>
                    Save Color
                </button>
            </div>

            <p>Username: {username}</p>

            <div className="username-change">
                <h3>Change Username</h3>
                <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                />
                <button onClick={handleUsernameChange} disabled={!newUsername}>
                    Save Username
                </button>
            </div>

            <button onClick={handleResetPassword} className="reset-password-button">
                Reset Password
            </button>

            {/* DELETE ACCOUNT Button */}
            <div className="delete-account-section">
                <h3>Danger Zone!</h3>
                <button 
                    onClick={() => setShowDeleteOverlay(true)} 
                    className="delete-account-button"
                >
                    Delete Account
                </button>
            </div>

            {/* DELETE ACCOUNT OVERLAY */}
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

            {isModerator && (
                <div className="manage-users-section">
                    <h3>🧰 Moderation 🧰</h3>
                    <Link to="/manage-users" className="manage-users-button">
                        Manage Users
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Account;
