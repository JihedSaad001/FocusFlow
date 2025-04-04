"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, MessageSquare } from "lucide-react";
import { fetchUserStats } from "../Api"; // Import your actual API function

type Message = {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

type ProductivityData = {
  focusTime: { duration: number }[]; // Array of focus time entries with duration property
  tasksCompleted: number;
  streakDays: number;
  level: number;
  focusSessions: any[];
  dailyTasks: any[];
};

const ProductivityAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [productivityData, setProductivityData] =
    useState<ProductivityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load productivity data from your actual API
  useEffect(() => {
    const loadProductivityData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (token) {
          // Use your actual API function to fetch user stats
          const data = await fetchUserStats(token, "month");

          // Set the productivity data with the actual structure from your API
          setProductivityData({
            focusTime: data.focusTime || [],
            tasksCompleted: data.tasksCompleted || 0,
            streakDays: data.streakDays || 0,
            level: data.level || 1,
            focusSessions: data.focusSessions || [],
            dailyTasks: data.dailyTasks || [],
          });
        } else {
          console.log("No token found, can't fetch productivity data");
        }
      } catch (err) {
        console.error("Error loading productivity data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProductivityData();

    // Add initial welcome message
    setMessages([
      {
        id: "1",
        text: "Hi there! I'm your productivity assistant. Ask me about your focus time, tasks, or productivity tips!",
        sender: "assistant",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Generate response
    setTimeout(() => {
      const response = generateResponse(input, productivityData);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 500); // Small delay to make it feel more natural
  };

  const calculateTotalFocusTime = (data: ProductivityData | null): number => {
    if (!data || !data.focusTime || data.focusTime.length === 0) return 0;

    // Calculate total focus time from your actual data structure
    return data.focusTime.reduce((total, entry) => {
      // Check if entry has a duration property
      if (typeof entry === "object" && entry.duration) {
        return total + entry.duration;
      }
      return total;
    }, 0);
  };

  const calculateTotalTasks = (data: ProductivityData | null): number => {
    if (!data) return 0;

    // Use the tasksCompleted field directly if available
    if (typeof data.tasksCompleted === "number") {
      return data.tasksCompleted;
    }

    // Or calculate from dailyTasks if that's how your data is structured
    if (data.dailyTasks && data.dailyTasks.length > 0) {
      return data.dailyTasks.reduce((total, task) => {
        return total + (task.count || 0);
      }, 0);
    }

    return 0;
  };

  const generateResponse = (
    query: string,
    data: ProductivityData | null
  ): string => {
    // If no data is available yet
    if (isLoading) {
      return "I'm still loading your productivity data. Please try again in a moment.";
    }

    if (!data) {
      return "I don't have access to your productivity data yet. Make sure you're logged in and have completed some activities.";
    }

    // Calculate total focus time and tasks
    const totalFocusTime = calculateTotalFocusTime(data);
    const totalTasks = calculateTotalTasks(data);
    const completedSessions = data.focusSessions
      ? data.focusSessions.filter((s) => s.completed).length
      : 0;

    // Convert query to lowercase for easier matching
    const q = query.toLowerCase();

    // Check for different types of questions and provide appropriate responses

    // Focus time related
    if (q.includes("focus") || q.includes("time") || q.includes("pomodoro")) {
      if (totalFocusTime < 60) {
        return `You've logged ${totalFocusTime} minutes of focus time. That's a good start! Try using the Pomodoro technique to increase your focus sessions.`;
      } else if (totalFocusTime < 180) {
        return `You've logged ${totalFocusTime} minutes of focus time. You're doing well! For better results, try to aim for at least 4 hours of focused work daily.`;
      } else {
        return `Impressive! You've logged ${totalFocusTime} minutes of focus time. Keep up the great work!`;
      }
    }

    // Sessions related
    if (q.includes("session") || q.includes("pomodoro")) {
      if (!data.focusSessions || data.focusSessions.length === 0) {
        return `You haven't completed any focus sessions yet. Try using the Pomodoro timer to get started.`;
      } else {
        return `You've completed ${completedSessions} focus sessions out of ${
          data.focusSessions.length
        } total sessions. Your completion rate is ${Math.round(
          (completedSessions / data.focusSessions.length) * 100
        )}%.`;
      }
    }

    // Tasks related
    if (
      q.includes("task") ||
      q.includes("todo") ||
      q.includes("to-do") ||
      q.includes("to do")
    ) {
      if (totalTasks === 0) {
        return `You haven't completed any tasks yet. Start by breaking down your work into smaller, manageable tasks.`;
      } else if (totalTasks < 5) {
        return `You've completed ${totalTasks} tasks. Good progress! Try the "eat the frog" technique - tackle your most challenging task first thing in the morning.`;
      } else {
        return `You've completed ${totalTasks} tasks. That's excellent productivity! Remember to celebrate your wins.`;
      }
    }

    // Streak related
    if (
      q.includes("streak") ||
      q.includes("consecutive") ||
      q.includes("days")
    ) {
      if (data.streakDays === 0) {
        return `You don't have an active streak yet. Visit the app daily and complete at least one task to build your streak.`;
      } else if (data.streakDays < 3) {
        return `You have a ${data.streakDays}-day streak. Keep going! The first week is crucial for building a habit.`;
      } else {
        return `Impressive! You have a ${data.streakDays}-day streak. Consistency is key to productivity.`;
      }
    }

    // Level/progress related
    if (q.includes("level") || q.includes("progress") || q.includes("rank")) {
      return `You're currently at Level ${data.level}. Keep completing tasks and focus sessions to earn XP and level up!`;
    }

    // Tips request
    if (
      q.includes("tip") ||
      q.includes("advice") ||
      q.includes("suggest") ||
      q.includes("help")
    ) {
      const tips = [
        "Try the 2-minute rule: If a task takes less than 2 minutes, do it immediately.",
        "Use ambient sounds to improve focus and concentration.",
        "Take short breaks every 25-30 minutes to maintain productivity.",
        "Plan your most important tasks the night before.",
        "Group similar tasks together to minimize context switching.",
        "Use the 'touch it once' principle: When you start something, finish it completely.",
        "Try time-blocking your calendar for focused work sessions.",
        "Minimize distractions by silencing notifications during focus time.",
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }

    // General productivity question
    if (
      q.includes("productive") ||
      q.includes("productivity") ||
      q.includes("efficiency")
    ) {
      if (totalFocusTime > 120 && totalTasks > 3) {
        return `Based on your stats, you're quite productive! You've logged ${totalFocusTime} minutes of focus time and completed ${totalTasks} tasks. Keep up the good work!`;
      } else if (totalFocusTime > 0 || totalTasks > 0) {
        return `You're making progress with ${totalFocusTime} minutes of focus time and ${totalTasks} completed tasks. Try setting specific goals for each work session to boost your productivity.`;
      } else {
        return `I don't have enough data yet to analyze your productivity. Start by logging focus sessions and completing tasks!`;
      }
    }

    // Greeting or hello
    if (
      q.includes("hi") ||
      q.includes("hello") ||
      q.includes("hey") ||
      q.includes("greetings")
    ) {
      return `Hello! How can I help with your productivity today?`;
    }

    // Default response for unrecognized queries
    return `I'm a simple productivity assistant. I can help with questions about your focus time, tasks, streaks, or provide productivity tips. What would you like to know?`;
  };

  return (
    <>
      {/* Chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-[#ff4e50] to-[#fc913a] p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Open productivity assistant"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-96 bg-[#1E1E1E] rounded-xl shadow-xl border border-gray-800 flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ff4e50] to-[#fc913a] p-3 flex justify-between items-center">
            <h3 className="text-white font-medium">Productivity Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-black/20 transition-all"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-[#ff4e50] text-white"
                      : "bg-[#252525] text-gray-200"
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about your productivity..."
                className="flex-1 bg-[#252525] text-white border-none rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#ff4e50]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className={`ml-2 p-2 rounded-full ${
                  input.trim()
                    ? "bg-[#ff4e50] hover:bg-[#fc913a] text-white"
                    : "bg-[#252525] text-gray-500"
                } transition-colors`}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductivityAssistant;
