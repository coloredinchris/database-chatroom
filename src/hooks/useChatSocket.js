import { useEffect, useRef, useState } from "react";
import { getAdjustedColor } from "../components/ColorUtils";
import { socket } from "./socket";

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

  const fetchRegisteredUsers = async () => {
    console.log("[DEBUG] fetchRegisteredUsers called");
    try {
      const res = await fetch("http://localhost:5000/registered-users", { credentials: "include" });
      const data = await res.json();
      console.log("[DEBUG] Registered users data fetched:", data);
      setOnlineUsers(data.users);
    } catch (err) {
      console.error("Error fetching registered users:", err);
    }
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

    const handleUserRoleUpdated = () => {
      console.log("[DEBUG] Received user_role_updated");
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
        return { ...msg, validUsernames: msg.validUsernames || [] };
      });
      setMessages(updated);
    });
    socket.on("message", handleMessage);
    socket.on("message_edited", handleMessageEdited);

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

    socket.on("user_role_updated", handleUserRoleUpdated);

    socket.on("ban_notice", (data) => {
      alert(`You have been banned.\nReason: ${data.reason}`);
      window.location.href = "/login";
    });

    socket.on("ban_response", (data) => {
      alert(data.success ? (data.message || "User banned successfully.") : (data.error || "Failed to ban user."));
    });

    socket.on("unban_success", (data) => {
      alert(`Successfully unbanned ${data.username}`);
    });

    socket.on("unban_response", (data) => {
      alert(data.success ? (data.message) : (data.error || "Failed to unban user."));
    });

    socket.on("promoted_notice", () => {
      alert("Congratulations! You have been promoted to Moderator.");
    });

    socket.on("demote_response", (data) => {
      alert(data.success ? (data.message || "User demoted successfully.") : (data.error || "Failed to demote user."));
    });

    socket.on("demoted_notice", () => {
      alert("You have been demoted from Moderator.");
    });

    socket.on('success', (data) => {
      alert(data.message || 'Action succeeded');
    });    

    socket.on("error", (data) => {
      alert(data.error || "Action failed");
    });

    return () => {
      socket.off("connect");
      socket.off("rate_limited");
      socket.off("set_username");
      socket.off("chat_history");
      socket.off("message", handleMessage);
      socket.off("message_edited", handleMessageEdited);
      socket.off("update_user_list");
      socket.off("user_role_updated", handleUserRoleUpdated);
      socket.off("ban_notice");
      socket.off("ban_response");
      socket.off("unban_success");
      socket.off("unban_response");
      socket.off("promoted_notice");
      socket.off("demote_response");
      socket.off("demoted_notice");
      socket.off("success");
      socket.off("error");
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
