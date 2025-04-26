import { useEffect, useRef, useState } from "react";
import { getAdjustedColor } from "../components/ColorUtils";
import { socket } from "./socket"; // use centralized socket

const useChatSocket = () => {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const userColors = useRef({});

  const handleJoin = (customName) => {
    if (!customName) return;
    socket.emit("request_username", { custom: customName });
    setHasJoined(true);
  };

  useEffect(() => {
    const handleMessage = (data) => {
      const normalizedUsername = data.username.toLowerCase();
      if (!userColors.current[normalizedUsername]) {
        userColors.current[normalizedUsername] = {
          lightColor: data.color || "#888",
          darkColor: getAdjustedColor(data.color || "#888", true),
        };
      }

      setMessages((prev) => {
        const updated = [...prev, data];

        if (data.username === "System") {
          setTimeout(() => {
            setMessages((current) =>
              current.map((msg) =>
                msg === data ? { ...msg, fadeOut: true } : msg
              )
            );
            setTimeout(() => {
              setMessages((current) => current.filter((msg) => msg !== data));
            }, 5000);
          }, 2000);
        }

        return updated;
      });
    };

    const handleMessageEdited = (data) => {
      const { message_id, new_content, edited_at } = data;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.message_id === message_id
            ? { ...msg, message: new_content, edited_at }
            : msg
        )
      );
    };

    socket.on("connect", () => console.log("Connected to server"));
    socket.on("rate_limited", (data) => alert(`You're sending messages too fast! Wait ${data.time_remaining}s...`));

    socket.on("set_username", (data) => {
      setUsername(data.username);
      userColors.current[data.username] = {
        lightColor: data.color,
        darkColor: getAdjustedColor(data.color, true),
      };
    });

    socket.on("chat_history", (history) => {
      const updated = history.map((msg) => {
        const normalized = msg.username.toLowerCase();
        if (!userColors.current[normalized]) {
          const light = msg.color || "#888";
          userColors.current[normalized] = {
            lightColor: light,
            darkColor: getAdjustedColor(light, true),
          };
        }

        return {
          ...msg,
          validUsernames: msg.validUsernames || [],
        };
      });
      setMessages(updated);
    });

    socket.on("message", handleMessage);

    socket.on("message_edited", handleMessageEdited); // 🛠️ LISTEN FOR EDITS

    socket.on("update_user_list", (users) => {
      setOnlineUsers(users);
      users.forEach((user) => {
        const normalized = user.username.toLowerCase();
        if (!userColors.current[normalized]) {
          userColors.current[normalized] = {
            lightColor: user.color,
            darkColor: getAdjustedColor(user.color, true),
          };
        }
      });
    });

    return () => {
      socket.off("message", handleMessage);
      socket.off("message_edited", handleMessageEdited); // 🛠️ CLEAN UP EDIT LISTENER
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon("http://localhost:5000/logout");
      localStorage.removeItem("username");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return {
    messages,
    setMessages,
    username,
    setUsername,
    hasJoined,
    handleJoin,
    onlineUsers,
    setOnlineUsers,
    userColors,
  };
};

export default useChatSocket;
export { socket };
