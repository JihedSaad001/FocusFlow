"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import NewsSection from "./NewsSection";

const quotes = [
  "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
  "Focus on being productive instead of busy.",
  "The key to productivity is to rotate your avoidance techniques.",
  "Start where you are. Use what you have. Do what you can.",
  "Success is the sum of small efforts, repeated day in and day out.",
];

const Home = () => {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [quote, setQuote] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dayProgress, setDayProgress] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Select a random quote
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    // Update time every minute
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Calculate day progress (from 0 to 100)
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const totalDayMs = endOfDay.getTime() - startOfDay.getTime();
      const elapsedMs = now.getTime() - startOfDay.getTime();
      setDayProgress(Math.floor((elapsedMs / totalDayMs) * 100));
    }, 60000);

 
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const totalDayMs = endOfDay.getTime() - startOfDay.getTime();
    const elapsedMs = now.getTime() - startOfDay.getTime();
    setDayProgress(Math.floor((elapsedMs / totalDayMs) * 100));

    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 pb-20">
      <div className="w-full max-w-4xl mx-auto">
        {/* Time and Date */}
        <div className="text-center mb-8 pt-8">
          <div className="text-5xl font-light mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-gray-400 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(currentTime)}</span>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-[#ff4e50] to-[#fc913a] bg-clip-text text-transparent">
              {user?.username || "User"}!
            </span>
          </h1>
          <p className="text-gray-400 mt-2">
            Stay focused and make today productive.
          </p>
        </div>

        {/* Day Progress */}
        <div className="mb-10">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Day Progress</span>
            <span>{dayProgress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-[#ff4e50] to-[#fc913a] h-2.5 rounded-full"
              style={{ width: `${dayProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Two-column layout for News and Quote */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* News Section - Takes 2/3 of the space */}
          <div className="md:col-span-2">
            <NewsSection />
          </div>

          {/* Quote - Takes 1/3 of the space */}
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-gray-800 flex items-center">
            <p className="text-xl italic text-gray-300">{`"${quote}"`}</p>
          </div>
        </div>
      </div>

      {/* Productivity Assistant removed */}
    </div>
  );
};

export default Home;
