import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/WelcomeScreen.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include", // Ensure cookies are sent and received
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("username", data.username); // Save username in localStorage
                navigate("/chatroom"); // Redirect to chatroom
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div className="welcome-overlay">
            <div className="welcome-box">
                <h2>Login</h2>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Email or Username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="login-button">Login</button>
                </form>
                <p>
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
                <p>
                    <Link to="/forgot-password">Forgot Password?</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;