// This file contains the client-side code for the chat application.
// It defines the ChatRoom component, which serves as the main interface for users to interact with the chatroom.
// The component handles real-time communication with the server using Socket.IO, displays messages, manages user interactions,
// and provides features such as file uploads, @mention highlighting, and dark/light mode toggling.
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "../styles/ChatRoom.css";
import WelcomeScreen from "./WelcomeScreen";

/**********           for testing LIVE             **********/
//const socket = io("https://chatroom-backend-qv2y.onrender.com");

/**********           for testing LOCAL            **********/
const socket = io("http://localhost:5000");

const readableColors = ["#3498db", "#9b59b6", "#1abc9c", "#f39c12", "#e67e22", "#e74c3c", "#2ecc71", "#34495e"];
const getRandomReadableColor = () => readableColors[Math.floor(Math.random() * readableColors.length)];

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesRef = useRef(null);
  const userColors = useRef({});
  const [darkMode, setDarkMode] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const handleJoin = (customName) => {
    socket.emit("request_username", { custom: customName });
    setHasJoined(true);
  };

  const fetchSuggestions = async (prefix) => {
    const res = await fetch(`https://api.datamuse.com/words?sp=${prefix}*&max=10`);
    const words = await res.json();
    return words.map((word) => word.word);
  };

  const handleInputChange = async (e) => {
    const text = e.target.value;
    setInput(text);
    const lastWord = text.split(" ").pop();
    if (lastWord.length >= 2) {
      const matches = await fetchSuggestions(lastWord);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  // Function to format messages
  const formatMessage = (msg) => {
    // Fallback for validUsernames if it's undefined
    const validUsernames = msg.validUsernames || [];
    console.log("Formatting message with validUsernames:", validUsernames); // Debugging log

    // Work with a copy of the message content to avoid modifying the original object
    let messageContent = msg.message || "";

    // Highlight file names (e.g., hello.txt, image.jpg)
    messageContent = messageContent.replace(/\b\w+\.(txt|jpg|jpeg|png|gif|mp4|mov|avi|webm|pdf|docx|xlsx)\b/gi, (match) => {
        return `<span class="highlight-file">${match}</span>`;
    });

    // Convert links to clickable hyperlinks
    messageContent = messageContent.replace(/(?<!<\/?span[^>]*>)\b((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)\b/gi, (match) => {
        const hasProtocol = match.startsWith("http://") || match.startsWith("https://");
        const url = hasProtocol ? match : `https://${match}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="highlight-link">${match}</a>`;
    });

    // Highlight mentioned usernames (e.g., @username or @User-1234 or @User!@#$%^&*())
    messageContent = messageContent.replace(/@([^\s]+)/g, (match, username) => {
        if (validUsernames.includes(username)) {
            console.log(`Highlighting mention: ${username}`); // Debugging log
            return `<span class="highlight-mention">@${username}</span>`;
        }
        return match;
    });

    return messageContent;
};

  const handleSend = () => {
    if (!input.trim()) return;

    if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("username", username);
        fetch("https://chatroom-backend-qv2y.onrender.com/upload", {
            method: "POST",
            body: formData,
        })
            .then((res) => res.json())
            .then((data) => console.log(data));
        setPendingFile(null);
        setInput("");
    } else {
        // Include the current list of online usernames in the message
        const validUsernames = onlineUsers.map((user) => user.username);
        console.log("Sending message with validUsernames:", validUsernames); // Debugging log
        socket.emit("message", { username, message: input, validUsernames });
        setInput("");
        setSuggestions([]);
    }
};

  useEffect(() => {
    const handleMessage = (data) => {
        console.log("Received message:", data); // Debugging log
        if (!userColors.current[data.username]) {
            userColors.current[data.username] = {
                usernameColor: data.color || "#888",
            };
        }
        setMessages((prev) => [...prev, data]);
    };

    socket.on("connect", () => console.log("Connected to server"));
    socket.on("set_username", (data) => {
      setUsername(data.username);
      userColors.current[data.username] = {
        usernameColor: data.color,
      };
    });
    socket.on("chat_history", (history) => {
      const updatedHistory = history.map((msg) => ({
          ...msg,
          validUsernames: msg.validUsernames || [], // Add fallback for older messages
      }));
      setMessages(updatedHistory);
  });
    socket.on("message", handleMessage);
    socket.on("update_user_list", (users) => {
      console.log("Updated online users:", users); // Debugging log
      setOnlineUsers(users);
    });
    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  if (!hasJoined) return <WelcomeScreen onJoin={handleJoin} />;

  return (
    <div className={`chatroom ${darkMode ? "dark-mode" : "light-mode"}`}>
      <div className="chatroom-main">
        <div className="left-group">
          <h1>Chatroom</h1>
          <button id="toggleMode" onClick={() => setDarkMode(!darkMode)}>
            Toggle Dark/Light Mode
          </button>

          <div id="messages" className="messages" ref={messagesRef}>
    {messages.map((msg, index) => {
        const isCurrentUser = msg.username === username; // Check if the message is from the current user
        const userColor = msg.color || "#888"; // Default color for usernames

        return (
            <div
                key={index}
                className={`message-bubble ${isCurrentUser ? "current-user" : "other-user"}`}
            >
                <div className="message-line">
                    <span className="timestamp">[{msg.timestamp}]</span>
                    <span className="username" style={{ color: userColor }}>
                        {msg.username}:
                    </span>
                </div>

                {msg.file_url ? (
                    /\.(jpg|jpeg|png|gif)$/i.test(msg.file_url) ? (
                        <img
                            src={`https://chatroom-backend-qv2y.onrender.com${msg.file_url}`}
                            alt={msg.message}
                            className="chat-image"
                        />
                    ) : /\.(mp4|mov|avi|webm)$/i.test(msg.file_url) ? (
                        <video
                            src={`https://chatroom-backend-qv2y.onrender.com${msg.file_url}`}
                            controls
                            className="chat-video"
                        />
                    ) : (
                        <a
                            href={`https://chatroom-backend-qv2y.onrender.com${msg.file_url}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {msg.message}
                        </a>
                    )
                ) : (
                    <span
                        className="message-text"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg) }}
                    />
                )}
            </div>
        );
    })}
</div>
        </div>

        <div className="user-list">
          <h3>Online</h3>
          <ul>
            {onlineUsers.map((user, i) => (
              <li key={i} style={{ color: user.color }}>
                {user.username}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="input-area">
        <button onClick={() => document.getElementById("fileInput").click()}>+</button>
        <input
          type="file"
          id="fileInput"
          accept=".txt,.jpg,.jpeg,.png,.gif,.mov,.avi,.mp4,.webm"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files.length > 0) {
              setPendingFile(e.target.files[0]);
              setInput(`[File ready to be sent: ${e.target.files[0].name}]`);
            }
          }}
        />
        <input
          id="input"
          type="text"
          value={input}
          placeholder="Type a message..."
          autoComplete="off"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button id="sendButton" onClick={handleSend}>
          Send
        </button>
        {suggestions.length > 0 && (
          <div id="autocomplete-box" className="autocomplete-suggestions">
            {suggestions.map((word, i) => (
              <div
                key={i}
                onClick={() => {
                  const words = input.split(" ");
                  words.pop();
                  words.push(word);
                  setInput(words.join(" ") + " ");
                  setSuggestions([]);
                }}
              >
                {word}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;