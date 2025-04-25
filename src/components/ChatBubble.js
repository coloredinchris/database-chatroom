// src/components/ChatBubble.js
import React from "react";
import { formatMessage } from "./ColorUtils";
import "../styles/ChatRoom.css";

const ChatBubble = ({ msg, username, userColors, darkMode }) => {
  const normalizedUsername = msg.username.toLowerCase();
  const userColor = darkMode
    ? userColors[normalizedUsername]?.darkColor || "#888"
    : userColors[normalizedUsername]?.lightColor || "#888";

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

  return (
    <div className={`message-bubble ${msg.username === username ? "current-user" : "other-user"}`}>
      <div className="message-line">
        <span className="timestamp">[{msg.timestamp}]</span>
        <span className="username" style={{ color: userColor }}>
          {msg.username}:
        </span>
      </div>
      {msg.file_url ? (
        <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
          {/* Show appropriate file previews */}
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
    </div>
  );
};

export default ChatBubble;
