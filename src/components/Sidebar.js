// src/components/Sidebar.js
import React, { useState } from "react";
import "../styles/ChatRoom.css";

const Sidebar = ({ onlineUsers, selectedUser, setSelectedUser, userColors, darkMode, sessionUsername, isModerator }) => {
  const [contextMenu, setContextMenu] = useState(null);

  const handleRightClick = (e, clickedUser) => {
    e.preventDefault();
    if (!isModerator) return; // normal users: no right click menu
    if (clickedUser.username === sessionUsername) return; // cannot right-click yourself

    const options = [];

    if (sessionUsername === "coloredinchris") {
      if (clickedUser.is_moderator) {
        options.push({
          label: "🛡️ Demote Moderator",
          action: () => {
            window.socket.emit("demote_user_command", { username: clickedUser.username });
            setContextMenu(null);
          },
        });
      } else {
        options.push({
          label: "🛡️ Promote to Moderator",
          action: () => {
            window.socket.emit("promote_user_command", { username: clickedUser.username });
            setContextMenu(null);
          },
        });
      }
    }

    if (!clickedUser.is_moderator || sessionUsername === "coloredinchris") {
      options.push({
        label: "🚫 Ban User",
        action: () => {
          const reason = prompt(`Enter a reason for banning '${clickedUser.username}':`, "Violation of rules.") || "No reason provided.";
          if (reason !== null) {
            window.socket.emit("ban_user_command", { username: clickedUser.username, reason });
            setContextMenu(null);
          }
        },
      });
    }

    if (options.length > 0) {
      setContextMenu({
        mouseX: e.clientX,
        mouseY: e.clientY,
        options,
      });
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
          {onlineUsers.map((userObj, idx) => {
            const username = userObj.username;
            const isMod = userObj.is_moderator || false;

            const normalizedUsername = username.toLowerCase();
            const userColor = darkMode
              ? userColors[normalizedUsername]?.darkColor || "#888"
              : userColors[normalizedUsername]?.lightColor || "#888";

            return (
              <li
                key={idx}
                style={{ color: userColor }}
                className={selectedUser === username ? "selected" : ""}
                onClick={() => setSelectedUser(username)}
                onContextMenu={(e) => handleRightClick(e, { username, is_moderator: isMod })}
              >
                {isMod && <span role="img" aria-label="moderator">🛡️</span>} {username}
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
            {contextMenu.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={opt.action}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "block", width: "100%", textAlign: "left", padding: "5px 10px" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
