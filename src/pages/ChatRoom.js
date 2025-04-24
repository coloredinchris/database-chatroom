// This file contains the client-side code for the chat application.
// It defines the ChatRoom component, which serves as the main interface for users to interact with the chatroom.
// The component handles real-time communication with the server using Socket.IO, displays messages, manages user interactions,
// and provides features such as file uploads, @mention highlighting, and dark/light mode toggling.
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "../styles/ChatRoom.css";
import WelcomeScreen from "./WelcomeScreen";
import HamburgerMenu from "../components/HamburgerMenu";

// Comment out the LIVE socket connection and uncomment the LOCAL one for local testing
/**********           for testing LIVE             **********/
// const socket = io("https://chatroom-backend-qv2y.onrender.com");

// Comment out the LOCAL socket connection and uncomment the LIVE one for production or LIVE testing
/**********           for testing LOCAL            **********/
const socket = io("http://localhost:5000");

const panelViews = ["online"];
const tooltipViews = ["rules", "formatting"];
const usernameColorMap = {
    "#00D0E0": { light: "#00D0E0", dark: "#144AB7" },
    "#00D0F0": { light: "#00D0F0", dark: "#324CCC" },
    "#00E000": { light: "#00E000", dark: "#2D606B" },
    "#00E060": { light: "#00E060", dark: "#0F6089" },
    "#CBCC32": { light: "#CBCC32", dark: "#8E4A3D" },
    "#99D65B": { light: "#99D65B", dark: "#6B562D" },
    "#26D8D8": { light: "#26D8D8", dark: "#324CCC" },
    "#DBC1BC": { light: "#DBC1BC", dark: "#8E3D8E" },
    "#EFD175": { light: "#EFD175", dark: "#99337F" },
    "#D6D65B": { light: "#D6D65B", dark: "#993366" },
};

const getAdjustedColor = (baseColor, isDarkMode) => {
    console.log("Adjusting color:", baseColor, "Dark mode:", isDarkMode);
    return isDarkMode ? usernameColorMap[baseColor]?.dark || baseColor : usernameColorMap[baseColor]?.light || baseColor;
};

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
    const [showToolTip, setShowToolTip] = useState(false);

    const [activePanel, setActivePanel] = useState("rules");

    const handleLogout = () => {
        fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" })
            .then((response) => {
                if (response.ok) {
                    localStorage.removeItem("username"); // Clear the username from localStorage
                    window.location.href = "/login"; // Redirect to the login page
                } else {
                    console.error("Logout failed:", response.statusText);
                }
            })
            .catch((err) => console.error("Logout failed:", err));
    };

    const handleJoin = (customName) => {
        if (!customName) return; // Ensure a username is provided
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

    const switchPanel = (direction) => {
        const currentIndex = tooltipViews.indexOf(activePanel);
        let newIndex;

        if (direction == "left") {
            newIndex = currentIndex-1;
            if (newIndex < 0) {
                newIndex = 1;
            }
        }
        else if (direction === "right") {
            newIndex = currentIndex + 1;
            if(newIndex > tooltipViews.length - 1) {
                newIndex = 0;
            }
        }
        setActivePanel(tooltipViews[newIndex]);
    }

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
                credentials: "include", // Ensure cookies are sent with the request
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error("File upload failed: " + res.statusText);
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
                ? userColors.current[username]?.darkColor || "#C67F36"
                : userColors.current[username]?.lightColor || "#888";
            el.style.color = color; // Apply the color dynamically
        });
    };

    useEffect(() => {
        const handleMessage = (data) => {
            console.log("Received message:", data);

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
        socket.off('rate_limited');
        socket.on("rate_limited", (data) => alert(`You are sending messages too quickly! You can send another message in ${data.time_remaining} seconds...`));
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

    useEffect(() => {
        const username = localStorage.getItem("username");
        if (!username) {
            window.location.href = "/login"; // Redirect to login if not authenticated
        }
    }, []);

    useEffect(() => {
        const handleBeforeUnload = () => {
            navigator.sendBeacon("http://localhost:5000/logout"); // Send logout request
            localStorage.removeItem("username"); // Clear username from localStorage
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const response = await fetch("http://localhost:5000/verify-session", {
                    method: "GET",
                    credentials: "include", // Ensure cookies are sent
                });

                if (!response.ok) {
                    localStorage.removeItem("username"); // Clear username from localStorage
                    window.location.href = "/login"; // Redirect to login
                }
            } catch (err) {
                console.error("Failed to verify session:", err);
                localStorage.removeItem("username");
                window.location.href = "/login";
            }
        };

        verifySession();
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
            {/* Pass the username prop to HamburgerMenu */}
            <HamburgerMenu menuType="chatroom" username={username} />
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
                                style={{ textAlign: "left" }}
                                dangerouslySetInnerHTML={{
                                    __html: msg.message.replace(
                                        msg.user,
                                        `<span style="color: ${
                                            darkMode
                                                ? getAdjustedColor(msg.color, true)
                                                : getAdjustedColor(msg.color, false)
                                        }; font-weight: bold;">${msg.user}</span>`
                                    ),
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
                <div className="sidebar">
                    <div className="sidebar-header">
                        <h2>Online</h2>
                    </div>
                    <div className="sidebar-content">
                        <div className="user-list">
                            <ul>
                                {onlineUsers.map((user, i) => {
                                    const normalizedUsername = user.username.toLowerCase(); // Normalize username for consistent lookup
                                    const userColor = darkMode ? userColors.current[normalizedUsername]?.darkColor || "#888" : userColors.current[normalizedUsername]?.lightColor || "#888";
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
                    
                </div>              
            </div>

            <div className="input-area">
                <button onClick={() => setShowToolTip(prev => !prev)}>?</button>
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

            {showToolTip && (
                 <div className="tooltip">
                 <div className="tooltip-header">
                     <button onClick={() => switchPanel("left")}>←</button>
                     <h2 >{activePanel}</h2>
                     <button onClick={() => switchPanel("right")}>→</button>
                 </div>
                 <div className="tooltip-content">
                     { activePanel === "rules" ? (
                         <ul className="chat-rules-list">
                             <li><strong>Be kind and respectful.</strong> Treat everyone with courtesy, even if you disagree.</li>
                             <li><strong>No harassment or hate speech.</strong> Discrimination of any kind will not be tolerated.</li>
                             <li><strong>Keep it clean.</strong> Avoid excessive profanity, NSFW content, or offensive language.</li>
                             <li><strong>No spam or flooding.</strong> Don’t repeatedly send the same messages or flood the chat.</li>
                             <li><strong>Stay on topic.</strong> Keep the conversation relevant to the chatroom’s purpose.</li>
                             <li><strong>No self-promotion or advertising.</strong> Unless it’s part of the conversation or allowed by the admin.</li>
                             <li><strong>Protect your privacy.</strong> Don’t share personal information — yours or anyone else’s.</li>
                             <li><strong>Report issues.</strong> If someone is breaking the rules, let a mod/admin know (if available).</li>
                         </ul>
 
                     ) : activePanel === "formatting" ? (
                         <div className="formatting-panel">
                             <h4>Formatting Messages</h4>
                             <ul className="formatting-list">
                                 <li>
                                 <strong>@username</strong> – Mention someone by typing <code>@</code> followed by their name.<br />
                                 <span className="highlight-mention">@Username</span>
                                 </li>
 
                                 <li>
                                 <strong>#text#</strong> – Highlight important words or labels.<br />
                                 <span className="highlight-hashtag">This is important</span>
                                 </li>
 
                                 <li>
                                 <strong>!text!</strong> – Emphasize warnings or urgent notes.<br />
                                 <span className="highlight-exclamation">Don't forget!</span>
                                 </li>
 
                                 <li>
                                 <strong>$text$</strong> – Style monetary or value-based terms.<br />
                                 <span className="highlight-dollar">reward</span>
                                 </li>
 
                                 <li>
                                 <strong>~text~</strong> – Add a playful or alternate tone.<br />
                                 <span className="highlight-tilde">suspicious</span>
                                 </li>
 
                                 <li>
                                 <strong>filename.ext</strong> – Valid file types (e.g. <code>.pdf</code>, <code>.png</code>) are auto-highlighted.<br />
                                 <span className="highlight-file">project.pdf</span>
                                 </li>
 
                                 <li>
                                 <strong>Links</strong> – Paste any link (with or without http).<br />
                                 <span className="highlight-link">example.com</span>
                                 </li>
                             </ul>
                         </div>
                     ) : null }
                 </div>
                     
             </div>
            )}
        </div>
    );
};

export default ChatRoom;
