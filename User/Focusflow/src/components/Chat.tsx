import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

interface ChatMessage {
  user: { _id: string; username: string };
  message: string;
  timestamp: string;
}

export function Chat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socket = useRef(
    io("https://focusflow-production.up.railway.app", { withCredentials: true })
  );
  const userId = jwtDecode<{ id: string }>(localStorage.getItem("token")!).id;

  useEffect(() => {
    // Fetch initial messages
    fetch(
      `https://focusflow-production.up.railway.app/api/projects/${projectId}/chat`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    )
      .then((res) => res.json())
      .then((data) => setMessages(data));

    socket.current.emit("joinRoom", projectId);

    socket.current.on("receiveMessage", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.current.disconnect();
    };
  }, [projectId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socket.current.emit("sendMessage", {
      projectId,
      userId,
      message: newMessage,
    });
    setNewMessage("");
  };

  return (
    <div className="chat-container bg-[#1E1E1E] p-4 rounded-lg">
      <div className="messages h-64 overflow-y-auto mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className="message mb-2">
            <span className="font-bold">{msg.user.username}:</span>{" "}
            {msg.message}
            <span className="text-gray-400 text-sm ml-2">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <div className="input-area flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700 text-white"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-red-500 rounded text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}
