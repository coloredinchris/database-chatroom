// src/pages/ManageUsers.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { socket, initializeSocket } from "../hooks/socket";
import HamburgerMenu from "../components/HamburgerMenu";
import UserContextMenu from "../components/UserContextMenu";
import useDarkMode from "../hooks/useDarkMode";
import "../styles/ManageUsers.css";

const ManageUsers = () => {
  const [activeTab, setActiveTab] = useState("banned");
  const [bannedUsers, setBannedUsers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [sessionUsername, setSessionUsername] = useState("");
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useDarkMode();
  const navigate = useNavigate();

  const fetchBannedUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/banned-users", { credentials: "include" });
      const data = await res.json();
      console.log("[DEBUG] Banned users fetched:", data);
      if (data.banned_users) {
        setBannedUsers(data.banned_users);
      } else if (data.banned) { 
        // fallback, just in case server still sends 'banned'
        setBannedUsers(data.banned);
      }
    } catch (err) {
      console.error("Error fetching banned users:", err);
    }
  };

  const fetchRegisteredUsers = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/registered-users", { credentials: "include" });
      const data = await res.json();
      if (data.users) {
        const bannedUsernames = bannedUsers.map((user) => user.username);
        const filtered = data.users.filter((user) => !bannedUsernames.includes(user.username));
        setRegisteredUsers(filtered);
      }
    } catch (err) {
      console.error("Error fetching registered users:", err);
    }
  }, [bannedUsers]);

  useEffect(() => {
    if (!socket || !socket.connected) {
        initializeSocket(); // safe re-call, won't double-connect
      }

    const handleSuccess = (data) => {
      alert(data.message || "Action succeeded");
      fetchRegisteredUsers();
      fetchBannedUsers();
    };
  
    socket.on('success', handleSuccess);
  
    return () => {
      socket.off('success', handleSuccess);
    };
  }, [fetchRegisteredUsers]);  

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch("http://localhost:5000/verify-session", { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.is_moderator) {
          setIsModerator(true);
          setSessionUsername(data.username || "");
          await fetchBannedUsers();
          await fetchRegisteredUsers();
        } else {
          alert("Access denied. You must be a moderator.");
          navigate("/account");
        }
      } catch (err) {
        console.error("Error verifying session:", err);
        navigate("/account");
      } finally {
        setLoading(false);
      }
    };

    verifySession();

    socket.on("ban_response", (data) => {
      if (data.success) {
        alert(data.message);
        fetchBannedUsers();
        fetchRegisteredUsers();
      } else {
        alert(data.error);
      }
    });

    socket.on("unban_response", (data) => {
      if (data.success) {
        alert(data.message);
        fetchBannedUsers();
        fetchRegisteredUsers();
      } else {
        alert(data.error);
      }
    });

    socket.on("promote_response", (data) => {
      if (data.success) {
        alert(data.message);
        fetchRegisteredUsers();
      } else {
        alert(data.error);
      }
    });

    return () => {
      socket.off("ban_response");
      socket.off("unban_response");
      socket.off("promote_response");
    };
  }, [navigate, fetchRegisteredUsers]);

  if (loading) {
    return <div className="loading-overlay">Loading...</div>;
  }

  if (!isModerator) return null; // Failsafe protection

  return (
    <div className="manage-users-container">
    <div className="manage-users-page">
      <HamburgerMenu 
            menuType="manage-users" 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
      />
      <h1>Manage Users</h1>

      <div className="tabs">
        <button
          onClick={() => setActiveTab("banned")}
          className={activeTab === "banned" ? "active" : ""}
        >
          Banned Users
        </button>
        <button
          onClick={() => setActiveTab("registered")}
          className={activeTab === "registered" ? "active" : ""}
        >
          Registered Users
        </button>
      </div>

      <div className="list-container">
        {activeTab === "banned" && (
          <ul className="registry-list">
          {bannedUsers.map((user) => (
            <UserContextMenu
              key={user.username}
              user={{ username: user.username, is_moderator: false, is_banned: true }}
              sessionUsername={sessionUsername}
              isSessionModerator={isModerator}
              onPromote={() => {}} // no promote for banned users
              onDemote={() => {}} // no demote for banned users
              onBan={() => {
                socket.emit("unban_user_command", { username: user.username });
              }}
              darkMode={darkMode}
            >
              <li>
                {user.username} (Reason: {user.reason})
              </li>
            </UserContextMenu>
          ))}
        </ul>             
        )}

        {activeTab === "registered" && (
          <ul className="registry-list">
          {registeredUsers.map((user) => (
            <UserContextMenu
              key={user.username}
              user={{ username: user.username, is_moderator: user.is_moderator, is_banned: false }}
              sessionUsername={sessionUsername}
              isSessionModerator={isModerator}
              onPromote={() => socket.emit("promote_user_command", { username: user.username })}
              onDemote={() => socket.emit("demote_user_command", { username: user.username })}
              onBan={() => {
                const reason = prompt(`Enter reason for banning ${user.username}:`, "Violation of rules.");
                if (reason !== null) {
                  socket.emit("ban_user_command", { username: user.username, reason });
                }
              }}
              darkMode={darkMode}
            >
              <li>
                {user.is_moderator && <span role="img" aria-label="moderator">🛡️</span>} {user.username}
              </li>
            </UserContextMenu>
          ))}
        </ul>        
        )}
      </div>
    </div>
    </div>
  );
};

export default ManageUsers;
