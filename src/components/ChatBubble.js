// src/components/ChatBubble.js
import React, { useState } from "react"; // Add useState!
import { formatMessage } from "./ColorUtils";
import "../styles/ChatRoom.css";
import { socket } from "../hooks/useChatSocket"; // You already import socket elsewhere, match your structure

const ChatBubble = ({ msg, username, userColors, darkMode }) => {
  const normalizedUsername = msg.username.toLowerCase();
  const userColor = darkMode
    ? userColors[normalizedUsername]?.darkColor || "#888"
    : userColors[normalizedUsername]?.lightColor || "#888";

const [isEditing, setIsEditing] = useState(false);
const [editContent, setEditContent] = useState(msg.message);

  if (msg.username === "System") {
    return (
      <div className={`message-bubble system-message ${msg.fadeOut ? "fade-out" : ""}`}>
        <div className="message-line">
          <span
            className="message-text"
            style={{ textAlign: "left" }}
            dangerouslySetInnerHTML={{
              __html: msg.message.replace(
                msg.user,
                `<span style="color: ${
                  darkMode
                    ? userColors[msg.user.toLowerCase()]?.darkColor
                    : userColors[msg.user.toLowerCase()]?.lightColor
                }; font-weight: bold;">${msg.user}</span>`
              ),
            }}
          />
        </div>
      </div>
    );
  }

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5000/edit-message/${msg.message_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // VERY important for session cookie
        body: JSON.stringify({ content: editContent }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setIsEditing(false); // Close the edit input after success
      } else {
        alert(data.error || "Failed to edit message");
      }
    } catch (error) {
      console.error("Edit failed:", error);
      alert("An error occurred while editing the message.");
    }
  };
  

  return (
    <div className={`message-bubble ${msg.username === username ? "current-user" : "other-user"}`}>
      <div className="message-line">
        <span className="timestamp">[{msg.timestamp}]</span>
        <span className="username" style={{ color: userColor }}>
          {msg.username}:
        </span>
      </div>

      {isEditing ? (
        <div className="edit-message">
          <button onClick={() => setIsEditing(false)}>Cancel</button>
          <button onClick={handleEditSubmit}>Save</button>
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </div>
      ) : (
        <>
          {msg.file_url ? (
            <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
              {/* File previews */}
              {/\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico)$/i.test(msg.file_url) ? (
                <img src={msg.file_url} alt={msg.message} className="chat-image" />
              ) : /\.(mp4|webm|ogg|ogv|mov|avi|mkv)$/i.test(msg.file_url) ? (
                <video src={msg.file_url} controls className="chat-video" />
              ) : /\.(mp3|wav|oga|flac|m4a|aac)$/i.test(msg.file_url) ? (
                <audio src={msg.file_url} controls className="chat-audio" />
              ) : (
                <span className="highlight-file">{msg.message}</span>
              )}
            </a>
          ) : (
            <span
              className="message-text"
              dangerouslySetInnerHTML={{ __html: formatMessage(msg) }}
            />
          )}
          {!msg.file_url && msg.edited_at && (
            <span className="edited-tag">(Edited)</span>
          )}

          {msg.username === username && !msg.file_url && (
            <button onClick={() => setIsEditing(true)} style={{ marginTop: "0.5rem" }}>
              Edit
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ChatBubble;
