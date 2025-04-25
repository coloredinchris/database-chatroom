import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Account.css";
import HamburgerMenu from "../components/HamburgerMenu";

const readableColors = [
    "#00D0E0", "#00D0F0", "#00E000", "#00E060", "#CBCC32",
    "#99D65B", "#26D8D8", "#DBC1BC", "#EFD175", "#D6D65B"
];

const Account = ({ username }) => {
    const [selectedColor, setSelectedColor] = useState("");
    const navigate = useNavigate();

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
        </div>
    );
};

export default Account;