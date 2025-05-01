import React, { useState,useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";
import "../styles/WelcomeScreen.css";

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
        if (darkMode) {
          document.body.classList.add('dark-mode');
          document.body.classList.remove('light-mode');
        } else {
          document.body.classList.add('light-mode');
          document.body.classList.remove('dark-mode');
        }
      }, [darkMode]);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateEmail(email)) {
            setError("Invalid email format");
            return;
        }
        if (!validatePassword(password)) {
            setError("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                navigate("/login"); // Redirect to login page
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div className="welcome-overlay">
            <HamburgerMenu 
            menuType="default" 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            />
            <div className="welcome-box">
                <h2>Register</h2>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleRegister}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
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
                    <button type="submit" className="register-button">Register</button>
                </form>
                <p>
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;