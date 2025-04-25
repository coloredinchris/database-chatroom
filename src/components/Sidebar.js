// src/components/Sidebar.js
import React from "react";
import "../styles/ChatRoom.css";

const Sidebar = ({ onlineUsers, selectedUser, setSelectedUser, userColors, darkMode }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Online</h2>
      </div>
      <div className="sidebar-content">
        <ul className="user-list">
          {onlineUsers.map((user, idx) => {
            const normalizedUsername = user.username.toLowerCase();
            const userColor = darkMode
              ? userColors[normalizedUsername]?.darkColor || "#888"
              : userColors[normalizedUsername]?.lightColor || "#888";

            return (
              <li
                key={idx}
                style={{ color: userColor }}
                className={selectedUser === user.username ? "selected" : ""}
                onClick={() => setSelectedUser(user.username)}
              >
                {user.username}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
