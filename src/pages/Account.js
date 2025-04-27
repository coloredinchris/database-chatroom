import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Account.css";
import HamburgerMenu from "../components/HamburgerMenu";

const readableColors = [
    "#00D0E0", "#00D0F0", "#00E000", "#00E060", "#CBCC32",
    "#99D65B", "#26D8D8", "#DBC1BC", "#EFD175", "#D6D65B"
];

const Account = ({ username }) => {
    const [selectedColor, setSelectedColor] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [isModerator, setIsModerator] = useState(false);
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
        if (!confirmed) return; // user canceled
      
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
      
            // After successful username change, force logout
            await fetch("http://localhost:5000/logout", {
              method: "POST",
              credentials: "include",
            });
      
            // Now redirect to login page
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

    return (
        <div className="account-page">
            <HamburgerMenu menuType="account" username={username} />
            <h1>Account Information</h1>
            <p>Username: {username}</p>

            <button onClick={handleResetPassword} className="reset-password-button">
                Reset Password
            </button>

            <div className="color-selection">
                <h3>Select a Color</h3>
                <div className="color-options">
                    {readableColors.map((color) => (
                        <div
                            key={color}
                            className={`color-box ${selectedColor === color ? "selected" : ""}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                        />
                    ))}
                </div>
                <button onClick={handleColorChange} disabled={!selectedColor}>
                    Save Color
                </button>
            </div>
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
            {isModerator && (
                <div className="manage-users-section">
                    <h3>Moderation</h3>
                    <Link to="/manage-users" className="manage-users-button">
                        Manage Users
                    </Link>
                </div>
            )}
        </div>
    </div>
    );
};

export default Account;