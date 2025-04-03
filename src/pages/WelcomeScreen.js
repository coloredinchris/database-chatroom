import React, { useState } from "react";
import "../styles/WelcomeScreen.css";

const WelcomeScreen = ({ onJoin }) => {
  const [customUsername, setCustomUsername] = useState("");

  return (
    <div className="welcome-overlay">
      <div className="welcome-box">
        <h2>Welcome to the Chatroom</h2>
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
