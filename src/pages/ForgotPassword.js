import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (!email) {
            setError("Please enter your email.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/generate-reset-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                const resetToken = data.reset_token;
                navigate(`/reset-password/${resetToken}`);
            } else {
                setError(data.error || "Failed to generate reset token");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div className="welcome-overlay">
            <HamburgerMenu />
            <div className="welcome-box">
                <h2>Forgot Password</h2>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleForgotPassword}>
                    <input
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="register-button">Reset Password</button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;