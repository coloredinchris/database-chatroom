// src/components/Sidebar.js
import React from "react";
import UserContextMenu from "./UserContextMenu";
import "../styles/ChatRoom.css";

const Sidebar = ({ onlineUsers, selectedUser, setSelectedUser, userColors, darkMode, sessionUsername, isModerator }) => {
  return (
    <div className="sidebar">
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
              <UserContextMenu
                key={idx}
                user={{ username, is_moderator: isMod }}
                sessionUsername={sessionUsername}
                isSessionModerator={isModerator}
                onPromote={() => window.socket.emit("promote_user_command", { username })}
                onDemote={() => window.socket.emit("demote_user_command", { username })}
                onBan={() => {
                  const reason = prompt(`Enter a reason for banning '${username}':`, "Violation of rules.") || "No reason provided.";
                  if (reason !== null) {
                    window.socket.emit("ban_user_command", { username, reason });
                  }
                }}
                darkMode={darkMode}
              >
                <li
                  style={{ color: userColor }}
                  className={selectedUser === username ? "selected" : ""}
                  onClick={() => setSelectedUser(username)}
                >
                  {isMod && <span role="img" aria-label="moderator">🛡️</span>} {username}
                </li>
              </UserContextMenu>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
