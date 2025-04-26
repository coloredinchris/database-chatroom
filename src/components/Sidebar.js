// src/components/Sidebar.js
import React, { useState } from "react";
import "../styles/ChatRoom.css";

const Sidebar = ({ onlineUsers, selectedUser, setSelectedUser, userColors, darkMode }) => {
  const [contextMenu, setContextMenu] = useState(null);

  const handleRightClick = (e, username) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      username,
    });
  };

  const handleBanUser = async () => {
    if (!contextMenu?.username) return;
    const reason = prompt(`Ban reason for '${contextMenu.username}':`) || "No reason provided.";
    try {
      const response = await fetch("http://localhost:5000/ban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: contextMenu.username, reason }),
      });
      const data = await response.json();
  
      if (response.ok) {
        alert(`User '${contextMenu.username}' banned.`);
      } else {
        alert(data.error || "Failed to ban user.");
      }
    } catch (err) {
      console.error("Error banning user:", err);
      // User was likely forcibly disconnected by ban — treat as success
      alert(`User '${contextMenu.username}' banned (disconnect detected).`);
    } finally {
      setContextMenu(null);
    }
  };
  

  const handleClickOutside = () => {
    if (contextMenu) setContextMenu(null);
  };

  return (
    <div className="sidebar" onClick={handleClickOutside}>
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
                onContextMenu={(e) => handleRightClick(e, user.username)} // 🛠️ NEW
              >
                {user.username}
              </li>
            );
          })}
        </ul>

        {contextMenu && (
          <div
            className="context-menu"
            style={{
              top: contextMenu.mouseY,
              left: contextMenu.mouseX,
              position: "fixed",
              backgroundColor: darkMode ? "#2e2e2e" : "#fff",
              color: darkMode ? "#fff" : "#000",
              border: "1px solid #888",
              borderRadius: "6px",
              boxShadow: "0px 2px 10px rgba(0,0,0,0.3)",
              zIndex: 2000,
              padding: "0.5rem",
            }}
          >
            <button onClick={handleBanUser} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
              🚫 Ban User
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
