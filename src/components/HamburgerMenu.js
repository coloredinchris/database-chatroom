import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/HamburgerMenu.css";

const HamburgerMenu = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="hamburger-menu">
            <button className="hamburger-icon" onClick={toggleMenu}>
                ☰
            </button>
            {isOpen && (
                <div className="menu-dropdown">
                    <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>Register</Link>
                    <Link to="/forgot-password" onClick={() => setIsOpen(false)}>Forgot Password</Link>
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;