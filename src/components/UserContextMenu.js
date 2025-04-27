// src/components/UserContextMenu.js
import React from "react";
import "../styles/UserContextMenu.css";

const UserContextMenu = ({ x, y, options, onClose }) => {
  return (
    <div className="user-context-menu" style={{ top: y, left: x }}>
      {options.map((opt, idx) => (
        <div key={idx} className="menu-item" onClick={opt.onClick}>
          {opt.label}
        </div>
      ))}
      <div className="menu-item cancel" onClick={onClose}>
        ❌ Cancel
      </div>
    </div>
  );
};

export default UserContextMenu;
