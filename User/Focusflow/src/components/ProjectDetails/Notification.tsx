import React from "react";

interface NotificationProps {
  notification: {
    message: string;
    type: "success" | "error";
  } | null;
}

const Notification: React.FC<NotificationProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        notification.type === "success" ? "bg-green-500" : "bg-red-500"
      } text-white`}
    >
      {notification.message}
    </div>
  );
};

export default Notification;
