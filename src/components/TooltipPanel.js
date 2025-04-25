import React from "react";
import "../styles/TooltipPanel.css";

const TooltipPanel = ({ showToolTip, activePanel, switchPanel, darkMode }) => {
  if (!showToolTip) return null;

  const panels = {
    rules: (
        <div className="scrollable-list">
      <ul className="rules-list">
        <li><strong>Be kind and respectful.</strong> Treat everyone with courtesy, even if you disagree.</li>
        <li><strong>No harassment or hate speech.</strong> Discrimination of any kind will not be tolerated.</li>
        <li><strong>Keep it clean.</strong> Avoid excessive profanity, NSFW content, or offensive language.</li>
        <li><strong>No spam or flooding.</strong> Don’t repeatedly send the same messages or flood the chat.</li>
        <li><strong>Stay on topic.</strong> Keep the conversation relevant to the chatroom’s purpose.</li>
        <li><strong>No self-promotion or advertising.</strong> Unless it’s part of the conversation or allowed by the admin.</li>
        <li><strong>Protect your privacy.</strong> Don’t share personal information — yours or anyone else’s.</li>
        <li><strong>Report issues.</strong> If someone is breaking the rules, let a mod/admin know (if available).</li>
      </ul>
      </div>
    ),
    formatting: (
        <div className="scrollable-list">
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
    ),
  };

  // Capitalize the title based on key
  const panelTitle = activePanel.charAt(0).toUpperCase() + activePanel.slice(1);

  return (
    <div className={`tooltip-panel ${darkMode ? "dark-mode" : "light-mode"}`}>
      <div className="tooltip-header">
        <button onClick={() => switchPanel("left")}>←</button>
        <h2>{activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}</h2>
        <button onClick={() => switchPanel("right")}>→</button>
      </div>
      {panels[activePanel]}
    </div>
  );  
};

export default TooltipPanel;
