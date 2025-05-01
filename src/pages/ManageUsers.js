// src/pages/ManageUsers.js
import React, { useState, useEffect } from "react";
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
  const [contextMenu, setContextMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useDarkMode();
  const navigate = useNavigate();

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
  }, []);  

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
  }, [navigate]);

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

  const fetchRegisteredUsers = async () => {
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
  };

  const handleRightClickBanned = (e, username) => {
    e.preventDefault();
  
    if (!username) return;
  
    const isSuperAdmin = sessionUsername === "coloredinchris";
  
    if (isSuperAdmin || isModerator) {
      setContextMenu({
        x: e.pageX,
        y: e.pageY,
        options: [
          {
            label: "🚫 Unban User",
            onClick: () => {
              socket.emit("unban_user_command", { username });
              setContextMenu(null);
            },
          },
        ],
      });
    } else {
      setContextMenu(null);
    }
  };  
  

  const handleRightClickRegistered = (e, clickedUser) => {
    e.preventDefault();
    const options = [];
  
    if (!clickedUser) return;
  
    const isSuperAdmin = sessionUsername === "coloredinchris";
    const isSelf = clickedUser.username === sessionUsername;
  
    if (isSelf) {
      // Prevent right-clicking yourself
      return setContextMenu(null);
    }
  
    if (isSuperAdmin) {
      // Super admin can promote, demote, and ban ANYONE (even moderators)
      if (clickedUser.is_moderator) {
        options.push({
          label: "⛔ Demote Moderator",
          onClick: () => {
            socket.emit("demote_user_command", { username: clickedUser.username });
            setContextMenu(null);
          },
        });
      } else {
        options.push({
          label: "🛡️ Promote to Moderator",
          onClick: () => {
            socket.emit("promote_user_command", { username: clickedUser.username });
            setContextMenu(null);
          },
        });
      }
  
      options.push({
        label: "🚫 Ban User",
        onClick: () => {
          const reason = window.prompt(`Enter a reason for banning ${clickedUser.username}:`, "Violation of rules.");
          if (reason !== null) {
            socket.emit("ban_user_command", { username: clickedUser.username, reason: reason || "No reason provided" });
            setRegisteredUsers((prev) => prev.filter((user) => user.username !== clickedUser.username));
            setContextMenu(null);
          }
        },
      });
    } else {
      // Regular moderator behavior
      if (!clickedUser.is_moderator) {
        options.push({
          label: "🚫 Ban User",
          onClick: () => {
            const reason = window.prompt(`Enter a reason for banning ${clickedUser.username}:`, "Violation of rules.");
            if (reason !== null) {
              socket.emit("ban_user_command", { username: clickedUser.username, reason: reason || "No reason provided" });
              setRegisteredUsers((prev) => prev.filter((user) => user.username !== clickedUser.username));
              setContextMenu(null);
            }
          },
        });
      }
    }
  
    if (options.length > 0) {
      setContextMenu({ x: e.pageX, y: e.pageY, options });
    } else {
      setContextMenu(null);
    }
  };  

  if (loading) {
    return <div className="loading-overlay">Loading...</div>;
  }

  if (!isModerator) return null; // Failsafe protection

  return (
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
          <ul className="user-list">
            {bannedUsers.map((user) => (
              <li key={user.username} onContextMenu={(e) => handleRightClickBanned(e, user.username)}>
                {user.username} (Reason: {user.reason})
              </li>
            ))}
          </ul>
        )}

        {activeTab === "registered" && (
          <ul className="user-list">
            {registeredUsers.map((user) => (
              <li key={user.username} onContextMenu={(e) => handleRightClickRegistered(e, user)}>
                {user.is_moderator && <span role="img" aria-label="moderator">🛡️</span>} {user.username}
              </li>
            ))}
          </ul>
        )}
      </div>

      {contextMenu && (
        <UserContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenu.options}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default ManageUsers;
