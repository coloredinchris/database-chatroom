import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const validatePassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const ResetPassword = () => {
    const { token } = useParams(); // Get the reset token from the URL
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!validatePassword(password)) {
            setError(
                "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                setError("");
                setTimeout(() => navigate("/login"), 3000); // Redirect to login after 3 seconds
            } else {
                setError(data.error || "Failed to reset password");
                setMessage("");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            setMessage("");
        }
    };

    return (
        <div className="welcome-overlay">
            <div className="welcome-box">
                <h2>Reset Password</h2>
                {message && <p style={{ color: "green" }}>{message}</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleResetPassword}>
                    <input
                        type="password"
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="register-button">Reset Password</button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;