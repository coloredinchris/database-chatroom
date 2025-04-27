// src/hooks/socket.js
import { io } from "socket.io-client";

let socket = null;

export function initializeSocket() {
  const username = localStorage.getItem('username');

  if (!socket) {
    socket = io("http://localhost:5000", {
      withCredentials: true,
      auth: { username: username }
    });

    // Wait for connection before exposing it
    socket.on("connect", () => {
      console.log("[Socket] Connected");
      window.socket = socket; // set window.socket only after connected
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err);
    });
  }

  return socket;
}

export { socket };
