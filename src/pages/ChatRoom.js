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
// const socket = io("https://chatroom-backend-qv2y.onrender.com");

// Comment out the LOCAL socket connection and uncomment the LIVE one for production or LIVE testing
/**********           for testing LOCAL            **********/
const socket = io("http://localhost:5000");

const usernameColorMap = {
    "#3498db": { light: "#3498db", dark: "#2E2E2E" },
    "#9b59b6": { light: "#9b59b6", dark: "#C67F36" },
    "#1abc9c": { light: "#1abc9c", dark: "#B5C7C7" },
};

const getAdjustedColor = (baseColor, isDarkMode) => {
    console.log("Adjusting color:", baseColor, "Dark mode:", isDarkMode); // Debugging log
    return isDarkMode ? usernameColorMap[baseColor]?.dark || baseColor : usernameColorMap[baseColor]?.light || baseColor;
};

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesRef = useRef(null);
  const userColors = useRef({}); // Store light and dark mode colors for each user
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
    let messageContent = msg.message || "";

    // Highlight valid filenames (e.g., file.png, image.jpg)
    messageContent = messageContent.replace(
        /\b\w+[-\w]*\.(txt|jpg|jpeg|png|gif|mp4|mov|avi|webm|pdf|docx|xlsx|html|css|js|json|xml|py|java|c|cpp|h|zip|rar|7z|tar|gz)\b/gi,
        (match) => `<span class="highlight-file">${match}</span>`
    );

    // Highlight valid links (e.g., http://example.com, www.example.com, example.com)
    messageContent = messageContent.replace(
        /\b((https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?)\b/gi,
        (match) => {
            // Ensure the match is not already highlighted as a file
            if (!/\b\w+[-\w]*\.(txt|jpg|jpeg|png|gif|mp4|mov|avi|webm|pdf|docx|xlsx|html|css|js|json|xml|py|java|c|cpp|h|zip|rar|7z|tar|gz)\b/gi.test(match)) {
                const url = match.startsWith("http") ? match : `http://${match}`;
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="highlight-link">${match}</a>`;
            }
            return match; // Return the original text if it's a file
        }
    );

    // Highlight mentioned usernames (e.g., @username)
    messageContent = messageContent.replace(/@([^\s]+)/g, (match, username) => {
        if (msg.validUsernames?.includes(username)) {
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

    // Highlight text surrounded by dollar signs ($)
    messageContent = messageContent.replace(/\$(.*?)\$/g, (match, text) => {
        return `<span class="highlight-dollar">${text}</span>`;
    });

    // Highlight text surrounded by tildes (~)
    messageContent = messageContent.replace(/~(.*?)~/g, (match, text) => {
        return `<span class="highlight-tilde">${text}</span>`;
    });

    return messageContent;
};

  const handleSend = () => {
    if (!input.trim() && !pendingFile) return;

    if (pendingFile) {
        // Check file size before uploading
        const maxFileSize = 5000 * 1024 * 1024; // 5000MB
        if (pendingFile.size > maxFileSize) {
            console.error("File is too large. Maximum allowed size is 5000MB.");
            alert("File is too large. Maximum allowed size is 5000MB.");
            setPendingFile(null);
            setInput("");
            return;
        }

        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("username", username);

        // ********* FOR LOCAL TESTING *********
        fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        })
            .then((res) => {
                if (res.status === 429) {
                    throw new Error("Too many requests. Please wait before trying again.");
                }
                return res.json();
            })
            .then((data) => {
                if (data.file_url) {
                    console.log("File uploaded successfully:", data.file_url);
                } else {
                    console.error("File upload failed:", data.error);
                }
            })
            .catch((err) => {
                console.error("Error uploading file:", err);
                alert(err.message); // Notify the user about the rate limit
            });

        // ********* FOR LIVE TESTING *********
          // fetch("https://chatroom-backend-qv2y.onrender.com/upload", {
          //   method: "POST",
          //   body: formData,
          //   })
          //   .then((res) => res.json())
          //   .then((data) => {
          //   if (data.file_url) {
          //   console.log("File uploaded successfully:", data.file_url);
          //   } else {
          //   console.error("File upload failed:", data.error);
          //   }
          //   })
          //   .catch((err) => {
          //   console.error("Error uploading file:", err);
          //   alert(err.message); // Notify the user about the rate limit
          // });

        setPendingFile(null);
        setInput("");
    } else {
        socket.emit("message", { username, message: input });
        setInput("");
    }
};

  const handleToggleMode = () => {
    const isDarkMode = !darkMode;
    setDarkMode(isDarkMode);

    // Save dark mode colors on the first toggle
    if (!userColors.current[username]?.darkColor) {
        console.log("Assigning dark mode colors for the first time"); // Debugging log
        Object.keys(userColors.current).forEach((user) => {
            const lightColor = userColors.current[user].lightColor;
            const darkColor = getAdjustedColor(lightColor, true); // Calculate dark mode color
            userColors.current[user].darkColor = darkColor; // Save dark mode color
        });
    }

    // Update username and system message colors
    updateColors(isDarkMode);
};

  const updateColors = (isDarkMode) => {
    // Update username colors
    document.querySelectorAll(".username").forEach((el) => {
      const username = el.dataset.username;
      const color = isDarkMode
        ? userColors.current[username]?.darkColor
        : userColors.current[username]?.lightColor;
      if (color) {
        el.style.color = color;
      }
    });

    // Update system message colors
    updateSystemMessageColors(isDarkMode);
  };

  const updateSystemMessageColors = (isDarkMode) => {
    document.querySelectorAll(".system-message .username[data-username]").forEach((el) => {
        const username = el.dataset.username; // Get the username from the data attribute
        const color = isDarkMode
            ? userColors.current[username]?.darkColor || "#C67F36" // Default to Earth Orange
            : userColors.current[username]?.lightColor || "#888"; // Default to gray
        el.style.color = color; // Apply the color dynamically
    });
};

  useEffect(() => {
    const handleMessage = (data) => {
        console.log("Received message:", data); // Debugging log

        // Ensure the user's color is saved in userColors
        const normalizedUsername = data.username.toLowerCase(); // Normalize to lowercase
        if (!userColors.current[normalizedUsername]) {
            userColors.current[normalizedUsername] = {
                lightColor: data.color || "#888",
                darkColor: getAdjustedColor(data.color || "#888", true),
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

        // Save the user's light mode color
        userColors.current[data.username] = {
            lightColor: data.color, // Save the light mode color
        };
    });
    socket.on("chat_history", (history) => {
        const updatedHistory = history.map((msg) => {
            const normalizedUsername = msg.username.toLowerCase(); // Normalize username for consistent lookup
            if (!userColors.current[normalizedUsername]) {
                const lightColor = msg.color || "#888"; // Default light mode color
                const darkColor = getAdjustedColor(lightColor, true); // Calculate dark mode color
                userColors.current[normalizedUsername] = {
                    lightColor,
                    darkColor,
                };
            }

            return {
                ...msg,
                validUsernames: msg.validUsernames || [], // Add fallback for older messages
            };
        });

        setMessages(updatedHistory);
    });
    socket.on("message", handleMessage);
    socket.on("update_user_list", (users) => {
        setOnlineUsers(users);

        // Update userColors for all users in the list
        users.forEach((user) => {
            const normalizedUsername = user.username.toLowerCase(); // Normalize username for consistent lookup
            if (!userColors.current[normalizedUsername]) {
                userColors.current[normalizedUsername] = {
                    lightColor: user.color, // Light mode color from the server
                    darkColor: getAdjustedColor(user.color, true), // Calculate dark mode color
                };
            }
        });
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

  useEffect(() => {
    const handleClickOutside = (event) => {
        const inputBox = document.getElementById("input");
        const autocompleteBox = document.getElementById("autocomplete-box");

        if (
            autocompleteBox &&
            !autocompleteBox.contains(event.target) &&
            inputBox !== event.target
        ) {
            setSuggestions([]); // Clear suggestions
        }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
        document.removeEventListener("click", handleClickOutside);
    };
}, []);

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

  console.log("User Colors:", userColors.current);

  return (
    <div className={`chatroom ${darkMode ? "dark-mode" : "light-mode"}`}>
      <div className="chatroom-main">
        <div className="left-group">
          <h1>Chatroom</h1>
          <button id="toggleMode" onClick={handleToggleMode}>
            Toggle Dark/Light Mode
          </button>

          <div
            id="messages"
            className="messages"
            ref={messagesRef}
            onMouseUp={handleTextHighlight} // Add this event listener
          >
            {messages.map((msg, index) => {
    const normalizedUsername = msg.username.toLowerCase(); // Normalize username for consistent lookup
    const userColor = darkMode
        ? userColors.current[normalizedUsername]?.darkColor || "#888"
        : userColors.current[normalizedUsername]?.lightColor || "#888";

    return (
        <div
            key={index}
            className={`message-bubble ${
                msg.username === "System"
                    ? `system-message ${msg.fadeOut ? "fade-out" : ""}`
                    : msg.username === username
                    ? "current-user"
                    : "other-user"
            }`}
        >
            <div className="message-line">
                {msg.username === "System" ? (
                    <span
                        className="message-text"
                        style={{ textAlign: "left" }} // Align text to the left
                        dangerouslySetInnerHTML={{
                            __html: msg.message, // Render the message with the color styling
                        }}
                    />
                ) : (
                    <>
                        <span className="timestamp">[{msg.timestamp}]</span>
                        <span
                            className="username"
                            style={{ color: userColor }} // Apply the dynamically determined color
                        >
                            {msg.username}:
                        </span>
                    </>
                )}
            </div>
            {msg.file_url ? (
                <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                    {/\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico)$/i.test(msg.file_url) ? (
                        <img
                            src={msg.file_url}
                            alt={msg.message}
                            className="chat-image"
                        />
                    ) : /\.(mp4|webm|ogg|ogv|mov|avi|mkv)$/i.test(msg.file_url) ? (
                        <video
                            src={msg.file_url}
                            controls
                            className="chat-video"
                        />
                    ) : /\.(mp3|wav|oga|flac|m4a|aac)$/i.test(msg.file_url) ? (
                        <audio
                            src={msg.file_url}
                            controls
                            className="chat-audio"
                        />
                    ) : /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv|md|epub|odt)$/i.test(msg.file_url) ? (
                        <span className="highlight-file">📄 {msg.message}</span>
                    ) : /\.(zip|rar|7z|tar|gz)$/i.test(msg.file_url) ? (
                        <span className="highlight-file">🗜️ {msg.message}</span>
                    ) : /\.(html|css|js|json|xml|py|java|c|cpp|h)$/i.test(msg.file_url) ? (
                        <span className="highlight-file">🧱 {msg.message}</span>
                    ) : (
                        <span className="highlight-file">{msg.message}</span>
                    )}
                </a>
            ) : (
                msg.username !== "System" && (
                    <span
                        className="message-text"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg) }}
                    />
                )
            )}
        </div>
    );
})}
          </div>
        </div>

        <div className="user-list">
          <h3>Online</h3>
          <ul>
    {onlineUsers.map((user, i) => {
        const normalizedUsername = user.username.toLowerCase(); // Normalize username for consistent lookup
        const userColor = darkMode
            ? userColors.current[normalizedUsername]?.darkColor || "#888"
            : userColors.current[normalizedUsername]?.lightColor || "#888";

        return (
            <li
                key={i}
                style={{ color: userColor }} // Use the dynamically determined color
                className={selectedUser === user.username ? "selected" : ""}
                onClick={() => setSelectedUser(user.username)} // Set the selected user
            >
                {user.username}
            </li>
        );
    })}
</ul>
        </div>
      </div>

      <div className="input-area">
        <button onClick={() => document.getElementById("fileInput").click()}>+</button>
        <input
  type="file"
  id="fileInput"
  accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff,.ico,.mp4,.webm,.ogg,.ogv,.mov,.avi,.mkv,.mp3,.wav,.oga,.flac,.m4a,.aac,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.md,.epub,.odt,.zip,.rar,.7z,.tar,.gz,.html,.css,.js,.json,.xml,.py,.java,.c,.cpp,.h"
  style={{ display: "none" }}
  onChange={(e) => {
    if (e.target.files.length > 0) {
      setPendingFile(e.target.files[0]);
      setInput(`[File ready to be sent: ${e.target.files[0].name}]`);
      e.target.value = ""; // Reset the file input to allow the same file to be selected again
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
