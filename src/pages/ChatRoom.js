// src/pages/ChatRoom.js
import React, { useState, useEffect } from "react";
import useChatSocket from "../hooks/useChatSocket";
import MessageList from "../components/MessageList";
import InputBar from "../components/InputBar";
import Sidebar from "../components/Sidebar";
import TooltipPanel from "../components/TooltipPanel";
import HamburgerMenu from "../components/HamburgerMenu";
import WelcomeScreen from "./WelcomeScreen";
import "../styles/ChatRoom.css";
import { socket } from "../hooks/useChatSocket";

const ChatRoom = () => {
  const {
    messages,
    setMessages,
    username,
    hasJoined,
    handleJoin,
    onlineUsers,
    userColors,
  } = useChatSocket();

  if (typeof window.socket === 'undefined') {
    window.socket = socket;
  }  

  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showToolTip, setShowToolTip] = useState(false);
  const [activePanel, setActivePanel] = useState("rules");
  const [sessionUsername, setSessionUsername] = useState("");
  const [isModerator, setIsModerator] = useState(false);

  const switchPanel = (dir) => {
    const views = ["rules", "formatting"];
    const idx = views.indexOf(activePanel);
    setActivePanel(
      dir === "left" ? views[(idx - 1 + views.length) % views.length] : views[(idx + 1) % views.length]
    );
  };

  useEffect(() => {
          if (darkMode) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
          } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
          }
        }, [darkMode]);  

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("http://localhost:5000/verify-session", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setSessionUsername(data.username);
          setIsModerator(data.is_moderator);
        }
      } catch (err) {
        console.error("Error verifying session:", err);
      }
    };

    fetchSession();
  }, []);

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

  const handleSend = () => {
    if (!input.trim() && !pendingFile) return;

    if (input.startsWith("/ban ")) {
      const parts = input.split(" ");
      const targetUsername = parts[1];
      const reason = parts.slice(2).join(" ") || "No reason provided.";
      if (targetUsername) {
        socket.emit("ban_user_command", { username: targetUsername, reason });
      }
      setInput(""); // Clear after sending
      return;
    }

    if (input.startsWith("/unban ")) {
      const parts = input.split(" ");
      const targetUsername = parts[1];
      if (targetUsername) {
        socket.emit("unban_user_command", { username: targetUsername });
      }
      setInput(""); // Clear after sending
      return;
    }

    if (pendingFile) {
      const maxSize = 5000 * 1024 * 1024;
      if (pendingFile.size > maxSize) {
        alert("File is too large. Max is 5000MB.");
        setPendingFile(null);
        setInput("");
        return;
      }

      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("username", username);

      fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.file_url) console.log("Uploaded:", data.file_url);
        })
        .catch((err) => alert(err.message));

      setPendingFile(null);
      setInput("");
      setSuggestions([]);
    } else {
      socket.emit("message", { message: input });
      setInput("");
      setSuggestions([]);
    }
  };

  const handleTextHighlight = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    if (!selectedText.trim()) return;

    const span = document.createElement("span");
    span.className = "custom-highlight";
    span.textContent = selectedText;
    span.addEventListener("click", () => {
      const parent = span.parentNode;
      if (parent) parent.replaceChild(document.createTextNode(span.textContent), span);
    });

    range.deleteContents();
    range.insertNode(span);
    selection.removeAllRanges();
  };

  if (!hasJoined) return <WelcomeScreen onJoin={handleJoin} />;

  return (
    <div className={`chatroom ${darkMode ? "dark-mode" : "light-mode"}`}>
      <HamburgerMenu 
      menuType="chatroom" 
      username={username} 
      darkMode={darkMode} 
      setDarkMode={setDarkMode} 
      />
      <div className="chatroom-main">
        <div className="left-group">
          <h1>Chatroom</h1>
          <MessageList
            messages={messages}
            username={username}
            userColors={userColors.current}
            darkMode={darkMode}
            handleTextHighlight={handleTextHighlight}
          />
        </div>
        <Sidebar
          onlineUsers={onlineUsers}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          userColors={userColors.current}
          darkMode={darkMode}
          sessionUsername={sessionUsername}
          isModerator={isModerator}
        />
      </div>

      <InputBar
        input={input}
        setInput={setInput}
        pendingFile={pendingFile}
        setPendingFile={setPendingFile}
        handleSend={handleSend}
        handleInputChange={handleInputChange}
        suggestions={suggestions}
        showToolTip={showToolTip}
        setShowToolTip={setShowToolTip}
      />

      <TooltipPanel
        showToolTip={showToolTip}
        activePanel={activePanel}
        switchPanel={switchPanel}
        darkMode={darkMode}
      />
    </div>
  );
};

export default ChatRoom;
