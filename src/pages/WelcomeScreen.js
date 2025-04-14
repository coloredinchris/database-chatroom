import React, { useState } from "react";
import "../styles/WelcomeScreen.css";

const WelcomeScreen = ({ onJoin }) => {
  const [customUsername, setCustomUsername] = useState("");

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
        
        <p>You can join with a custom name or anonymously.</p>
        <input
          type="text"
          placeholder="Enter a username"
          value={customUsername}
          onChange={(e) => setCustomUsername(e.target.value)}
        />
        <div className="welcome-buttons">
          <button onClick={() => onJoin(customUsername)}>Join</button>
          <button onClick={() => onJoin("")}>Join Anonymously</button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
