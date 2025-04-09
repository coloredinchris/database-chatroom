// This file contains the client-side code for the chat application.
// It defines the ChatRoom component, which serves as the main interface for users to interact with the chatroom.
// The component handles real-time communication with the server using Socket.IO, displays messages, manages user interactions,
// and provides features such as file uploads, @mention highlighting, and dark/light mode toggling.
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "../styles/ChatRoom.css";
import WelcomeScreen from "./WelcomeScreen";

// Comment out the LIVE socket connection and uncomment the LOCAL one for local testing
/**********           for testing LIVE             **********/
const socket = io("https://chatroom-backend-qv2y.onrender.com");

// Comment out the LOCAL socket connection and uncomment the LIVE one for production or LIVE testing
/**********           for testing LOCAL            **********/
// const socket = io("http://localhost:5000");

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
  const [selectedUser, setSelectedUser] = useState(null);

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

    // Highlight text surrounded by hashtags (#)
    messageContent = messageContent.replace(/#(.*?)#/g, (match, text) => {
        return `<span class="highlight-hashtag">${text}</span>`;
    });

    // Highlight text surrounded by exclamation points (!)
    messageContent = messageContent.replace(/!(.*?)!/g, (match, text) => {
        return `<span class="highlight-exclamation">${text}</span>`;
    });

    // Highlight text surrounded by question marks (?)
    messageContent = messageContent.replace(/\?(.*?)\?/g, (match, text) => {
        return `<span class="highlight-question">${text}</span>`;
    });

    // Highlight text surrounded by periods (.)
    messageContent = messageContent.replace(/\.(.*?)\./g, (match, text) => {
        return `<span class="highlight-period">${text}</span>`;
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

        setMessages((prev) => {
            const updatedMessages = [...prev, data];

            // If the message is from "System", add the fade-out class and remove it after the animation
            if (data.username === "System") {
                setTimeout(() => {
                    // Add the fade-out class to the system message
                    setMessages((currentMessages) =>
                        currentMessages.map((msg) =>
                            msg === data ? { ...msg, fadeOut: true } : msg
                        )
                    );

                    // Remove the system message after the fade-out animation
                    setTimeout(() => {
                        setMessages((currentMessages) =>
                            currentMessages.filter((msg) => msg !== data)
                        );
                    }, 5000); // Match the fade-out animation duration
                }, 2000); // Delay before starting the fade-out
            }

            return updatedMessages;
        });
    };

    socket.on("connect", () => console.log("Connected to server"));
    socket.on("set_username", (data) => {
        setUsername(data.username);
        userColors.current[data.username] = {
            usernameColor: data.color,
        };
    });
    socket.on("chat_history", (history) => {
        const filteredHistory = history.filter((msg) => msg.username !== "System"); // Exclude old system messages
        const updatedHistory = filteredHistory.map((msg) => ({
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

  const handleTextHighlight = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    if (selectedText.trim()) {
        // Create a span element to wrap the selected text
        const span = document.createElement("span");
        span.className = "custom-highlight";
        span.textContent = selectedText;

        // Add a click event listener to remove the highlight
        span.addEventListener("click", () => {
            const parent = span.parentNode;
            if (parent) {
                // Replace the span with its text content
                parent.replaceChild(document.createTextNode(span.textContent), span);
            }
        });

        // Replace the selected text with the highlighted span
        range.deleteContents();
        range.insertNode(span);

        // Clear the selection
        selection.removeAllRanges();
    }
};

  if (!hasJoined) return <WelcomeScreen onJoin={handleJoin} />;

  return (
    <div className={`chatroom ${darkMode ? "dark-mode" : "light-mode"}`}>
      <div className="chatroom-main">
        <div className="left-group">
          <h1>Chatroom</h1>
          <button id="toggleMode" onClick={() => setDarkMode(!darkMode)}>
            Toggle Dark/Light Mode
          </button>

          <div
            id="messages"
            className="messages"
            ref={messagesRef}
            onMouseUp={handleTextHighlight} // Add this event listener
          >
            {messages.map((msg, index) => {
              const isCurrentUser = msg.username === username; // Check if the message is from the current user
              const userColor = msg.color || "#888"; // Default color for usernames

              return (
                <div
                    key={index}
                    className={`message-bubble ${
                        msg.username === "System"
                            ? `system-message ${msg.fadeOut ? "fade-out" : ""}`
                            : isCurrentUser
                            ? "current-user"
                            : "other-user"
                    }`}
                >
                    <div className="message-line">
                        {msg.username !== "System" && (
                            <>
                                <span className="timestamp">[{msg.timestamp}]</span>
                                <span className="username" style={{ color: userColor }}>
                                    {msg.username}:
                                </span>
                            </>
                        )}
                    </div>

                    <span
                        className="message-text"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg) }}
                    />
                </div>
              );
            })}
          </div>
        </div>

        <div className="user-list">
          <h3>Online</h3>
          <ul>
            {onlineUsers.map((user, i) => (
              <li
                key={i}
                style={{ color: user.color }}
                className={selectedUser === user.username ? "selected" : ""}
                onClick={() => setSelectedUser(user.username)} // Set the selected user
              >
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