import React, { useEffect } from "react";
import "../styles/WelcomeScreen.css";

const WelcomeScreen = ({ onJoin }) => {
  useEffect(() => {
    // Retrieve the username from localStorage
    const username = localStorage.getItem("username");

    if (!username) {
      console.error("No username found in localStorage. Redirecting to login.");
      window.location.href = "/login"; // Redirect to login if no username is found
    }
  }, []);

  const handleJoin = () => {
    const username = localStorage.getItem("username");
    if (username) {
      onJoin(username); // Pass the username to the onJoin function
    }
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-box">
        <div className="welcome-overview">
          <h3>Welcome to the Chatroom 👋</h3>
          <p>We're glad you're here! This space is designed to help you connect, collaborate, and share ideas in real time.</p>

          <ul className="welcome-overview-list">
            <li><strong>Send messages</strong> instantly with support for custom formatting.</li>
            <li><strong>Mention other users</strong> using <code>@username</code> to get their attention.</li>
            <li><strong>Upload files</strong> like images, documents, or code using the <button>+</button> button next to input.</li>
            <li><strong>Paste links</strong> and watch them turn clickable — no formatting needed.</li>
          </ul>
        </div>

        <div className="welcome-buttons">
          <button onClick={handleJoin}>Join</button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
