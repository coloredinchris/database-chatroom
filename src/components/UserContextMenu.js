// src/components/UserContextMenu.js
import React, { useState } from "react";
import "../styles/UserContextMenu.css";

const UserContextMenu = ({
  children,
  user,
  sessionUsername,
  isSessionModerator,
  onPromote,
  onDemote,
  onBan,
  darkMode,
}) => {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!isSessionModerator || user.username === sessionUsername) return;

    const options = [];
    if (sessionUsername === "coloredinchris") {
      options.push(
        user.is_moderator
          ? { label: "🛡️ Demote Moderator", onClick: () => { onDemote(); closeMenu(); } }
          : { label: "🛡️ Promote to Moderator", onClick: () => { onPromote(); closeMenu(); } }
      );
    }

    if (user.is_banned) {
      options.push({
        label: "✅ Unban User",
        onClick: () => { onBan(); closeMenu(); },
      });
    } else if (!user.is_moderator || sessionUsername === "coloredinchris") {
      options.push({
        label: "🚫 Ban User",
        onClick: () => { onBan(); closeMenu(); },
      });
    }    

    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      options,
    });
  };

  const closeMenu = () => setContextMenu(null);

  return (
    <div onContextMenu={handleContextMenu} style={{ width: "100%" }}>
      {children}
      {contextMenu && (
        <div
          className="user-context-menu"
          style={{
            position: "fixed",
            top: contextMenu.mouseY,
            left: contextMenu.mouseX,
            backgroundColor: darkMode ? "#333" : "#fff",
            color: darkMode ? "#fff" : "#000",
            border: "1px solid #888",
            borderRadius: "6px",
            boxShadow: "0px 2px 10px rgba(0,0,0,0.3)",
            zIndex: 2000,
            padding: "0.5rem",
          }}
        >
          {contextMenu.options.map((opt, idx) => (
            <div
              key={idx}
              className="menu-item"
              onClick={opt.onClick}
              style={{ cursor: "pointer", padding: "5px 10px" }}
            >
              {opt.label}
            </div>
          ))}
          <div
            className="menu-item cancel"
            onClick={closeMenu}
            style={{ cursor: "pointer", padding: "5px 10px" }}
          >
            ❌ Cancel
          </div>
        </div>
      )}
    </div>
  );
};

export default UserContextMenu;
