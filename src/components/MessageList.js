// src/components/MessageList.js
import React, { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import "../styles/ChatRoom.css";

const MessageList = ({ messages, username, userColors, darkMode, handleTextHighlight }) => {
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div id="messages" className="messages" ref={messagesRef} onMouseUp={handleTextHighlight}>
      {messages.map((msg, idx) => (
        <ChatBubble
          key={idx}
          msg={msg}
          username={username}
          userColors={userColors}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
};

export default MessageList;
