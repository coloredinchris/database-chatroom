// src/components/TooltipPanel.js
import React from "react";
import "../styles/WelcomeScreen.css";

const TooltipPanel = ({ showToolTip, activePanel, switchPanel }) => {
  if (!showToolTip) return null;

  return (
    <div className="tooltip">
      <div className="tooltip-header">
        <button onClick={() => switchPanel("left")}>←</button>
        <h2>{activePanel}</h2>
        <button onClick={() => switchPanel("right")}>→</button>
      </div>
      <div className="tooltip-content">
        {activePanel === "rules" ? (
          <ul className="chat-rules-list">
            <li><strong>Be kind and respectful.</strong></li>
            <li><strong>No harassment or hate speech.</strong></li>
            <li><strong>Keep it clean.</strong></li>
            <li><strong>No spam or flooding.</strong></li>
            <li><strong>Stay on topic.</strong></li>
            <li><strong>No self-promotion or advertising.</strong></li>
            <li><strong>Protect your privacy.</strong></li>
            <li><strong>Report issues to mods/admins.</strong></li>
          </ul>
        ) : activePanel === "formatting" ? (
          <div className="formatting-panel">
            <h4>Formatting Messages</h4>
            <ul>
              <li><strong>@username</strong> – Mention someone</li>
              <li><strong>#text#</strong> – Highlight words</li>
              <li><strong>!text!</strong> – Urgent notes</li>
              <li><strong>$text$</strong> – Monetary style</li>
              <li><strong>~text~</strong> – Playful tone</li>
              <li><strong>filename.ext</strong> – File highlight</li>
              <li><strong>Links</strong> – Paste any URL</li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TooltipPanel;
