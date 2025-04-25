// src/components/InputBar.js
import React from "react";
import "../styles/ChatRoom.css";

const InputBar = ({
  input,
  setInput,
  pendingFile,
  setPendingFile,
  handleSend,
  handleInputChange,
  suggestions,
  showToolTip,
  setShowToolTip,
}) => {
  return (
    <div className="input-area">
      {/* ? Button for Tooltip */}
      {typeof setShowToolTip === "function" && (
        <button onClick={() => setShowToolTip((prev) => !prev)}>?</button>
      )}
      {/* + Button for File Upload */}
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
            e.target.value = "";
          }
        }}
      />
      {/* Text Input */}
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
      {/* Send Button */}
      <button id="sendButton" onClick={handleSend}>
        Send
      </button>

      {/* Autocomplete */}
      {suggestions?.length > 0 && (
        <div id="autocomplete-box" className="autocomplete-suggestions">
          {suggestions.map((word, i) => (
            <div
              key={i}
              onClick={() => {
                const words = input.split(" ");
                words.pop();
                words.push(word);
                setInput(words.join(" ") + " ");
              }}
            >
              {word}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InputBar;
