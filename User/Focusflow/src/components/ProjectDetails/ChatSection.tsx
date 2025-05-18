import React from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import Chat from "../Chat";

interface ChatSectionProps {
  id: string | undefined;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  id,
  showChat,
  setShowChat,
}) => {
  return (
    <div className="mb-8">
      <div
        className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
        onClick={() => setShowChat(!showChat)}
      >
        <div className="flex items-center">
          <MessageSquare className="w-6 h-6 mr-3 text-red-500" />
          <h2 className="text-2xl font-semibold">Project Chat</h2>
        </div>
        {showChat ? <ChevronUp /> : <ChevronDown />}
      </div>

      {showChat && (
        <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
          {id && <Chat projectId={id} />}
        </div>
      )}
    </div>
  );
};

export default ChatSection;
