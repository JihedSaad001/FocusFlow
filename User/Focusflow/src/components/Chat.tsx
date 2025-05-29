import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
//to fix later
import { jwtDecode } from "jwt-decode";
import type { ChatMessage, DecodedToken } from "../types";

export function Chat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(
    io(import.meta.env.VITE_API_BASE_URL || "https://focusflow-production.up.railway.app")
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        setCurrentUserId(decoded.id);
      } catch (error) {
        console.error("❌ Error decoding token:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `https://focusflow-production.up.railway.app/api/projects/${projectId}/chat`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch chat messages");
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
      }
    };

    fetchMessages();

    // Connect to socket
    socketRef.current.emit("joinRoom", projectId);
    console.log("Joined chat room:", projectId);

    // Listen for new messages
    socketRef.current.on("receiveMessage", (message: ChatMessage) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current.off("receiveMessage");
    };
  }, [projectId]);

  // Scroll to bottom when messages change
  //useEffect(() => {
  //messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  //}, [messages]);

  const sendMessage = () => {
    // at the backend in projectRoutes.js
    if (!newMessage.trim() || !currentUserId) return;

    socketRef.current.emit("sendMessage", {
      projectId,
      userId: currentUserId,
      message: newMessage,
    });

    setNewMessage("");
  };

  return (
    <div className="chat-container">
      <div className="messages h-64 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className="message flex items-start gap-2">
            <img
              src={
                msg.user.profilePic ||
                "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png" ||
                "/placeholder.svg"
              }
              alt={`${msg.user.username}'s profile`}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src =
                  "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png";
              }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {msg.user.username}
                </span>
                <span className="text-gray-400 text-sm">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-300">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-3 rounded-lg bg-black/50 border border-gray-700 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
          placeholder="Type a message..."
          onKeyPress={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          className="p-3 bg-red-500 rounded-lg hover:bg-red-600 transition-colors text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
