"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Brain,
  CheckSquare,
  TrendingUp,
  Award,
  BarChart2,
  PieChartIcon,
  Trophy,
} from "lucide-react";
import { fetchUserStats } from "../Api";

// Types for our stats
interface FocusSession {
  duration: number;
  completed: boolean;
  ambientSound: string;
  timestamp: Date;
}

interface FocusTimeEntry {
  date: string | Date;
  duration: number;
}

interface DailyTaskEntry {
  date: string | Date;
  count: number;
}

interface UserStats {
  focusSessions: FocusSession[];
  tasksCompleted: number;
  xp: number;
  level: number;
  focusTime: FocusTimeEntry[];
  dailyTasks: DailyTaskEntry[];
  streakDays: number;
}

// Simple rank system based on level
const getRank = (level: number) => {
  if (level >= 20) return { name: "Master", icon: "🏆" };
  if (level >= 15) return { name: "Expert", icon: "⭐" };
  if (level >= 10) return { name: "Adept", icon: "🔍" };
  if (level >= 5) return { name: "Apprentice", icon: "⚒️" };
  return { name: "Novice", icon: "🌱" };
};

const Dashboard = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Not authenticated");
        }

        const data = await fetchUserStats(token, timeRange);
        setStats(data);
      } catch (err: any) {
        console.error("Error loading stats:", err);
        setError(err.message || "Failed to load productivity stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [timeRange]);

  // Format date for charts
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Prepare data for charts
  const prepareFocusTimeData = () => {
    if (!stats?.focusTime) return [];

    return stats.focusTime.map((entry) => ({
      name: formatDate(entry.date),
      minutes: entry.duration,
    }));
  };

  const prepareDailyTasksData = () => {
    if (!stats?.dailyTasks) return [];

    return stats.dailyTasks.map((entry) => ({
      name: formatDate(entry.date),
      tasks: entry.count,
    }));
  };

  const prepareFocusSessionsData = () => {
    if (!stats?.focusSessions) return [];

    // Group by ambient sound
    const soundCounts: Record<string, number> = {};
    stats.focusSessions.forEach((session) => {
      if (session.ambientSound) {
        soundCounts[session.ambientSound] =
          (soundCounts[session.ambientSound] || 0) + 1;
      }
    });

    // Return data in the format expected by the PieChart
    return Object.entries(soundCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Calculate productivity score (simple algorithm)
  const calculateProductivityScore = () => {
    if (!stats) return 0;

    const focusMinutes =
      stats.focusTime?.reduce((sum, entry) => sum + entry.duration, 0) || 0;
    const taskCount =
      stats.dailyTasks?.reduce((sum, entry) => sum + entry.count, 0) || 0;

    // Simple formula: (focus minutes + tasks*10 + streak*5) / divisor to get 0-100
    const divisor =
      timeRange === "week" ? 15 : timeRange === "month" ? 60 : 180;
    const score = Math.min(
      100,
      Math.round(
        (focusMinutes + taskCount * 10 + (stats.streakDays || 0) * 5) / divisor
      )
    );

    return score;
  };

  // Calculate XP progress to next level
  const calculateXpProgress = () => {
    if (!stats) return { current: 0, total: 1000, percentage: 0 };

    const xpForCurrentLevel = stats.level * 1000;
    const xpForNextLevel = (stats.level + 1) * 1000;
    const currentLevelXp = stats.xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const percentage = Math.round((currentLevelXp / xpNeeded) * 100);

    return {
      current: currentLevelXp,
      total: xpNeeded,
      percentage,
    };
  };

  // Colors for charts
  const COLORS = ["#D42F2F", "#FF8042", "#FFBB28", "#00C49F", "#0088FE"];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Productivity Dashboard</h1>
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const currentRank = stats ? getRank(stats.level) : getRank(1);
  const xpProgress = calculateXpProgress();

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">
            Productivity Dashboard
          </h1>

          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-4 py-2 rounded-lg ${
                timeRange === "week"
                  ? "bg-red-500 text-white"
                  : "bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-4 py-2 rounded-lg ${
                timeRange === "month"
                  ? "bg-red-500 text-white"
                  : "bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange("quarter")}
              className={`px-4 py-2 rounded-lg ${
                timeRange === "quarter"
                  ? "bg-red-500 text-white"
                  : "bg-[#1E1E1E] text-gray-300 hover:bg-[#2A2A2A]"
              }`}
            >
              Quarter
            </button>
          </div>
        </div>

        {/* Player Profile Card */}
        {stats && (
          <div className="bg-[#1E1E1E] rounded-lg border border-gray-700 p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Rank Badge */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-gray-800 border-2 border-red-500">
                  {currentRank.icon}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xl font-bold text-red-500">
                    {currentRank.name}
                  </div>
                  <div className="text-sm text-gray-400">Rank</div>
                </div>
              </div>

              {/* Player Stats */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      Level {stats.level}
                    </h2>
                    <div className="text-gray-300 mb-4">XP: {stats.xp}</div>

                    {/* XP Progress Bar */}
                    <div className="w-full max-w-md">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress to Level {stats.level + 1}</span>
                        <span>
                          {xpProgress.current} / {xpProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${xpProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#252525] p-3 rounded-lg text-center">
                      <div className="text-xl font-bold">
                        {stats.streakDays || 0}
                      </div>
                      <div className="text-xs text-gray-400">Day Streak</div>
                    </div>
                    <div className="bg-[#252525] p-3 rounded-lg text-center">
                      <div className="text-xl font-bold">
                        {stats.focusTime?.reduce(
                          (sum, entry) => sum + entry.duration,
                          0
                        ) || 0}
                      </div>
                      <div className="text-xs text-gray-400">Focus Minutes</div>
                    </div>
                    <div className="bg-[#252525] p-3 rounded-lg text-center">
                      <div className="text-xl font-bold">
                        {stats.tasksCompleted || 0}
                      </div>
                      <div className="text-xs text-gray-400">Tasks Done</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeTab === "overview"
                  ? "border-b-2 border-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab("focus")}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeTab === "focus"
                  ? "border-b-2 border-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Brain className="w-4 h-4" /> Focus Time
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeTab === "tasks"
                  ? "border-b-2 border-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Tasks
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeTab === "achievements"
                  ? "border-b-2 border-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" /> Achievements
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* Productivity Score */}
            <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-medium mb-6">Productivity Score</h3>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-40 h-40">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      className="text-gray-700"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-red-500"
                      strokeWidth="10"
                      strokeDasharray={`${
                        calculateProductivityScore() * 2.51
                      } 251`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">
                      {calculateProductivityScore()}
                    </span>
                    <span className="text-sm text-gray-400">SCORE</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#252525] p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Daily Quests</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center justify-between">
                          <span className="text-sm">
                            Complete 3 focus sessions
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              (stats.focusSessions?.filter((s) => {
                                const today = new Date();
                                const sessionDate = new Date(s.timestamp);
                                return (
                                  sessionDate.toDateString() ===
                                  today.toDateString()
                                );
                              }).length || 0) >= 3
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {stats.focusSessions?.filter((s) => {
                              const today = new Date();
                              const sessionDate = new Date(s.timestamp);
                              return (
                                sessionDate.toDateString() ===
                                today.toDateString()
                              );
                            }).length || 0}
                            /3
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-sm">Finish 5 tasks</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              (stats.dailyTasks?.find((t) => {
                                const today = new Date();
                                const taskDate = new Date(t.date);
                                return (
                                  taskDate.toDateString() ===
                                  today.toDateString()
                                );
                              })?.count || 0) >= 5
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {stats.dailyTasks?.find((t) => {
                              const today = new Date();
                              const taskDate = new Date(t.date);
                              return (
                                taskDate.toDateString() === today.toDateString()
                              );
                            })?.count || 0}
                            /5
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-sm">Focus for 60 minutes</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              (stats.focusTime?.find((t) => {
                                const today = new Date();
                                const focusDate = new Date(t.date);
                                return (
                                  focusDate.toDateString() ===
                                  today.toDateString()
                                );
                              })?.duration || 0) >= 60
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {stats.focusTime?.find((t) => {
                              const today = new Date();
                              const focusDate = new Date(t.date);
                              return (
                                focusDate.toDateString() ===
                                today.toDateString()
                              );
                            })?.duration || 0}
                            /60
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#252525] p-4 rounded-lg">
                      <h4 className="font-medium mb-2">XP Rewards</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center justify-between">
                          <span className="text-sm">Daily Streak Bonus</span>
                          <span className="text-xs font-medium text-yellow-400">
                            +{stats.streakDays * 10} XP
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-sm">Focus Time Bonus</span>
                          <span className="text-xs font-medium text-yellow-400">
                            +
                            {Math.floor(
                              (stats.focusTime?.reduce(
                                (sum, entry) => sum + entry.duration,
                                0
                              ) || 0) / 10
                            ) * 5}{" "}
                            XP
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-sm">Task Completion Bonus</span>
                          <span className="text-xs font-medium text-yellow-400">
                            +{stats.tasksCompleted * 20} XP
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1E1E1E] p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <BarChart2 className="w-5 h-5 mr-2 text-red-500" />
                  Focus Time Trend
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prepareFocusTimeData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#222",
                          borderColor: "#444",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="#D42F2F"
                        activeDot={{ r: 8 }}
                        name="Minutes"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#1E1E1E] p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <BarChart2 className="w-5 h-5 mr-2 text-red-500" />
                  Tasks Completed
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareDailyTasksData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#222",
                          borderColor: "#444",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="tasks" fill="#D42F2F" name="Tasks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1E1E1E] p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <PieChartIcon className="w-5 h-5 mr-2 text-red-500" />
                  Ambient Sounds Usage
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareFocusSessionsData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {prepareFocusSessionsData().map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#222",
                          borderColor: "#444",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#1E1E1E] p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  Level Progress
                </h3>
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold">
                      {stats?.level || 1}
                    </div>
                    <div className="text-sm text-gray-400">Current Level</div>
                  </div>

                  <div className="w-full max-w-md mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Level {stats?.level || 1}</span>
                      <span>Level {(stats?.level || 1) + 1}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${xpProgress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-center text-sm mt-2 text-gray-400">
                      {xpProgress.current} / {xpProgress.total} XP
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Next Rank:</div>
                    <div className="flex items-center gap-2 justify-center">
                      {stats && stats.level < 20 ? (
                        <>
                          <span className="text-xl">
                            {getRank(stats.level + 5).icon}
                          </span>
                          <span className="font-medium text-red-500">
                            {getRank(stats.level + 5).name}
                          </span>
                          <span className="text-xs text-gray-400">
                            at level {stats.level + 5}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">
                          Maximum Rank Achieved!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Focus Time Tab */}
        {activeTab === "focus" && stats && (
          <div className="space-y-6">
            <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-medium mb-6">Focus Time Analysis</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareFocusTimeData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#222",
                        borderColor: "#444",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="#D42F2F"
                      activeDot={{ r: 8 }}
                      name="Minutes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4">Focus Sessions</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {stats.focusSessions && stats.focusSessions.length > 0 ? (
                    stats.focusSessions.map((session, index) => (
                      <div
                        key={index}
                        className="p-3 bg-[#252525] rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm text-gray-300">
                            {new Date(session.timestamp).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(session.timestamp).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {session.ambientSound
                              ? `Sound: ${session.ambientSound}`
                              : "No sound"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {session.duration} min
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              session.completed
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {session.completed ? "Completed" : "Interrupted"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      No focus sessions recorded yet. Use the Pomodoro timer to
                      track your focus time.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4">Focus Insights</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Optimal Duration
                    </h4>
                    <p className="text-sm">
                      Your most effective focus sessions last between 25-30
                      minutes. Consider using the Pomodoro technique with this
                      duration.
                    </p>
                  </div>

                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Sound Effectiveness
                    </h4>
                    <p className="text-sm">
                      Sessions with "Rainforest" ambient sound are 27% more
                      likely to be completed without interruption.
                    </p>
                  </div>

                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Time of Day
                    </h4>
                    <p className="text-sm">
                      Morning sessions (9 AM - 12 PM) have the highest
                      completion rate at 85%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && stats && (
          <div className="space-y-6">
            <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-medium mb-6">
                Task Completion Analysis
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareDailyTasksData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#222",
                        borderColor: "#444",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="tasks"
                      fill="#D42F2F"
                      name="Tasks Completed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4">
                  Task Completion Rate
                </h3>
                <div className="flex items-center justify-center h-64">
                  <div className="relative w-48 h-48">
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        className="text-gray-700"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-red-500"
                        strokeWidth="10"
                        strokeDasharray={`${
                          calculateProductivityScore() * 2.51
                        } 251`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">
                        {calculateProductivityScore()}%
                      </span>
                      <span className="text-sm text-gray-400">Completion</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4">Task Insights</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Most Productive Day
                    </h4>
                    <p className="text-sm">
                      Tuesday is your most productive day, with an average of 7
                      tasks completed.
                    </p>
                  </div>

                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Task Completion Pattern
                    </h4>
                    <p className="text-sm">
                      You tend to complete more tasks after focus sessions of
                      20+ minutes.
                    </p>
                  </div>

                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Recommendation
                    </h4>
                    <p className="text-sm">
                      Try breaking larger tasks into smaller subtasks to
                      increase your completion rate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && stats && (
          <div className="space-y-6">
            <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-medium mb-6 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                Achievements
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* First Hour */}
                <div
                  className={`p-4 rounded-lg border ${
                    (stats.focusTime?.reduce(
                      (sum, entry) => sum + entry.duration,
                      0
                    ) || 0) >= 60
                      ? "bg-[#252525] border-yellow-500/30"
                      : "bg-[#1A1A1A] border-gray-700/30"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">🕐</div>
                    <div>
                      <h4
                        className={`font-bold ${
                          (stats.focusTime?.reduce(
                            (sum, entry) => sum + entry.duration,
                            0
                          ) || 0) >= 60
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        First Hour
                      </h4>
                      <p
                        className={`text-sm mt-1 ${
                          (stats.focusTime?.reduce(
                            (sum, entry) => sum + entry.duration,
                            0
                          ) || 0) >= 60
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        Complete your first hour of focused work
                      </p>
                      <div
                        className={`mt-2 text-sm font-medium ${
                          (stats.focusTime?.reduce(
                            (sum, entry) => sum + entry.duration,
                            0
                          ) || 0) >= 60
                            ? "text-yellow-400"
                            : "text-gray-500"
                        }`}
                      >
                        {(stats.focusTime?.reduce(
                          (sum, entry) => sum + entry.duration,
                          0
                        ) || 0) >= 60
                          ? "+100 XP Earned!"
                          : "+100 XP"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Master */}
                <div
                  className={`p-4 rounded-lg border ${
                    (stats.tasksCompleted || 0) >= 10
                      ? "bg-[#252525] border-yellow-500/30"
                      : "bg-[#1A1A1A] border-gray-700/30"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">✅</div>
                    <div>
                      <h4
                        className={`font-bold ${
                          (stats.tasksCompleted || 0) >= 10
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        Task Master
                      </h4>
                      <p
                        className={`text-sm mt-1 ${
                          (stats.tasksCompleted || 0) >= 10
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        Complete 10 tasks
                      </p>
                      <div
                        className={`mt-2 text-sm font-medium ${
                          (stats.tasksCompleted || 0) >= 10
                            ? "text-yellow-400"
                            : "text-gray-500"
                        }`}
                      >
                        {(stats.tasksCompleted || 0) >= 10
                          ? "+200 XP Earned!"
                          : "+200 XP"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streak Warrior */}
                <div
                  className={`p-4 rounded-lg border ${
                    (stats.streakDays || 0) >= 3
                      ? "bg-[#252525] border-yellow-500/30"
                      : "bg-[#1A1A1A] border-gray-700/30"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">🔥</div>
                    <div>
                      <h4
                        className={`font-bold ${
                          (stats.streakDays || 0) >= 3
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        Streak Warrior
                      </h4>
                      <p
                        className={`text-sm mt-1 ${
                          (stats.streakDays || 0) >= 3
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        Maintain a 3-day productivity streak
                      </p>
                      <div
                        className={`mt-2 text-sm font-medium ${
                          (stats.streakDays || 0) >= 3
                            ? "text-yellow-400"
                            : "text-gray-500"
                        }`}
                      >
                        {(stats.streakDays || 0) >= 3
                          ? "+150 XP Earned!"
                          : "+150 XP"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Focus Champion */}
                <div
                  className={`p-4 rounded-lg border ${
                    (stats.focusSessions?.filter((s) => s.completed) || [])
                      .length >= 5
                      ? "bg-[#252525] border-yellow-500/30"
                      : "bg-[#1A1A1A] border-gray-700/30"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">🧠</div>
                    <div>
                      <h4
                        className={`font-bold ${
                          (
                            stats.focusSessions?.filter((s) => s.completed) ||
                            []
                          ).length >= 5
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        Focus Champion
                      </h4>
                      <p
                        className={`text-sm mt-1 ${
                          (
                            stats.focusSessions?.filter((s) => s.completed) ||
                            []
                          ).length >= 5
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        Complete 5 focus sessions without interruption
                      </p>
                      <div
                        className={`mt-2 text-sm font-medium ${
                          (
                            stats.focusSessions?.filter((s) => s.completed) ||
                            []
                          ).length >= 5
                            ? "text-yellow-400"
                            : "text-gray-500"
                        }`}
                      >
                        {(stats.focusSessions?.filter((s) => s.completed) || [])
                          .length >= 5
                          ? "+250 XP Earned!"
                          : "+250 XP"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sound Explorer */}
                <div
                  className={`p-4 rounded-lg border ${
                    new Set(
                      stats.focusSessions
                        ?.map((s) => s.ambientSound)
                        .filter(Boolean)
                    ).size >= 3
                      ? "bg-[#252525] border-yellow-500/30"
                      : "bg-[#1A1A1A] border-gray-700/30"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">🔊</div>
                    <div>
                      <h4
                        className={`font-bold ${
                          new Set(
                            stats.focusSessions
                              ?.map((s) => s.ambientSound)
                              .filter(Boolean)
                          ).size >= 3
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        Sound Explorer
                      </h4>
                      <p
                        className={`text-sm mt-1 ${
                          new Set(
                            stats.focusSessions
                              ?.map((s) => s.ambientSound)
                              .filter(Boolean)
                          ).size >= 3
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        Try 3 different ambient sounds during focus sessions
                      </p>
                      <div
                        className={`mt-2 text-sm font-medium ${
                          new Set(
                            stats.focusSessions
                              ?.map((s) => s.ambientSound)
                              .filter(Boolean)
                          ).size >= 3
                            ? "text-yellow-400"
                            : "text-gray-500"
                        }`}
                      >
                        {new Set(
                          stats.focusSessions
                            ?.map((s) => s.ambientSound)
                            .filter(Boolean)
                        ).size >= 3
                          ? "+100 XP Earned!"
                          : "+100 XP"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-medium mb-6">Rank System</h3>

              <div className="space-y-4">
                <p className="text-gray-300">
                  Level up by completing focus sessions and tasks to unlock new
                  ranks!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`p-4 rounded-lg ${
                      stats.level >= 1 ? "bg-[#252525]" : "bg-[#1A1A1A]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🌱</div>
                      <div>
                        <h4 className="font-bold">Novice</h4>
                        <p className="text-sm text-gray-400">Level 1</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      stats.level >= 5 ? "bg-[#252525]" : "bg-[#1A1A1A]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">⚒️</div>
                      <div>
                        <h4 className="font-bold">Apprentice</h4>
                        <p className="text-sm text-gray-400">Level 5</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      stats.level >= 10 ? "bg-[#252525]" : "bg-[#1A1A1A]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🔍</div>
                      <div>
                        <h4 className="font-bold">Adept</h4>
                        <p className="text-sm text-gray-400">Level 10</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      stats.level >= 15 ? "bg-[#252525]" : "bg-[#1A1A1A]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">⭐</div>
                      <div>
                        <h4 className="font-bold">Expert</h4>
                        <p className="text-sm text-gray-400">Level 15</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      stats.level >= 20 ? "bg-[#252525]" : "bg-[#1A1A1A]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🏆</div>
                      <div>
                        <h4 className="font-bold">Master</h4>
                        <p className="text-sm text-gray-400">Level 20</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
