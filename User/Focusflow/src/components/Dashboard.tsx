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
import axios from "axios";

// Rank system based on level
const getRank = (level: number) => {
  if (level >= 20) return { name: "Master", icon: "🏆" };
  if (level >= 15) return { name: "Expert", icon: "⭐" };
  if (level >= 10) return { name: "Adept", icon: "🔍" };
  if (level >= 5) return { name: "Apprentice", icon: "⚒️" };
  return { name: "Novice", icon: "🌱" };
};

// Achievement definitions
const achievements = [
  {
    id: "first-hour",
    icon: "🕐",
    title: "First Hour",
    description: "Complete your first hour of focused work",
    xp: 100,
    condition: (stats: any) =>
      (stats.focusTime?.reduce(
        (sum: number, entry: any) => sum + entry.duration,
        0
      ) || 0) >= 60,
  },
  {
    id: "task-master",
    icon: "✅",
    title: "Task Master",
    description: "Complete 10 tasks",
    xp: 200,
    condition: (stats: any) => (stats.tasksCompleted || 0) >= 10,
  },
  {
    id: "streak-warrior",
    icon: "🔥",
    title: "Streak Warrior",
    description: "Maintain a 3-day productivity streak",
    xp: 150,
    condition: (stats: any) => (stats.streakDays || 0) >= 3,
  },
  {
    id: "focus-champion",
    icon: "🧠",
    title: "Focus Champion",
    description: "Complete 5 focus sessions without interruption",
    xp: 250,
    condition: (stats: any) =>
      (stats.focusSessions?.filter((s: any) => s.completed) || []).length >= 5,
  },
  {
    id: "sound-explorer",
    icon: "🔊",
    title: "Sound Explorer",
    description: "Try 3 different ambient sounds during focus sessions",
    xp: 100,
    condition: (stats: any) =>
      //set trod el array unique values
      new Set(
        stats.focusSessions?.map((s: any) => s.ambientSound).filter(Boolean)
      ).size >= 3,
  },
];

const Dashboard = () => {
  // Initialize with the user model structure that comes from the backend
  const [stats, setStats] = useState({
    focusSessions: [
      {
        duration: 0,
        completed: false,
        ambientSound: "",
        timestamp: new Date(),
      },
    ],
    tasksCompleted: 0,
    xp: 0,
    level: 1,
    focusTime: [
      {
        date: new Date(),
        duration: 0,
      },
    ],
    dailyTasks: [
      {
        date: new Date(),
        count: 0,
      },
    ],
    todoTasks: [
      {
        _id: "",
        title: "",
        completed: false,
        createdAt: new Date(),
      },
    ],
    streakDays: 0,
    lastActive: new Date(),
    lastStreakUpdate: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("week");
  // ? te9bel null if null stop , if not go on
  const getTotalFocusTime = () => {
    return (
      stats?.focusTime?.reduce((sum, entry) => sum + entry.duration, 0) || 0
    );
  };

  const getCompletedFocusSessions = () => {
    return stats?.focusSessions?.filter((s) => s.completed) || [];
  };

  const getTodaysFocusSessions = () => {
    const today = new Date();
    return (
      stats?.focusSessions?.filter((s) => {
        const sessionDate = new Date(s.timestamp);
        return sessionDate.toDateString() === today.toDateString();
      }) || []
    );
  };

  const getTodaysTaskCount = () => {
    const today = new Date();
    return (
      stats?.dailyTasks?.find((t) => {
        const taskDate = new Date(t.date);
        return taskDate.toDateString() === today.toDateString();
      })?.count || 0
    );
  };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Not authenticated. Please log in to view your dashboard."
          );
        }
        const api = axios.create({
          baseURL: import.meta.env.VITE_API_URL || "https://focusflow-production.up.railway.app/api",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        // Get user stats
        const response = await api.get(`/user/stats?timeRange=${timeRange}`);
        setStats(response.data);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Failed to load productivity stats. Please try again later.");
       
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
  // Simplified chart data preparation
  const prepareFocusTimeData = () =>
    stats?.focusTime?.map((entry) => ({
      name: formatDate(entry.date),
      minutes: entry.duration,
    })) || [];

  const prepareDailyTasksData = () =>
    stats?.dailyTasks?.map((entry) => ({
      name: formatDate(entry.date),
      tasks: entry.count,
    })) || [];

  const prepareFocusSessionsData = () => {
    if (!stats?.focusSessions) return [];

    const soundCounts = new Map();
    stats.focusSessions.forEach((session) => {
      if (session.ambientSound) {
        const count = soundCounts.get(session.ambientSound) || 0;
        soundCounts.set(session.ambientSound, count + 1);
      }
    });

    return Array.from(soundCounts.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Calculate productivity score (simplified)
  const calculateProductivityScore = () => {
    if (!stats) return 0;

    const focusMinutes = getTotalFocusTime();
    const taskCount =
      stats.dailyTasks?.reduce((sum, entry) => sum + entry.count, 0) || 0;
    const streakBonus = (stats.streakDays || 0) * 5;

    const divisor = { week: 15, month: 60, quarter: 180 }[timeRange] || 15;
    const rawScore = (focusMinutes + taskCount * 10 + streakBonus) / divisor;

    return Math.min(100, Math.round(rawScore));
  };

  // Calculate task completion rate
  const calculateTaskCompletionRate = () => {
    if (!stats?.todoTasks?.length) return 0;

    const completedTasks = stats.todoTasks.filter(
      (task) => task.completed
    ).length;
    return Math.round((completedTasks / stats.todoTasks.length) * 100);
  };

  // Calculate XP progress to next level
  const calculateXpProgress = () => {
    if (!stats) return { current: 0, total: 1000, percentage: 0 };

    const currentLevelXp = stats.xp - stats.level * 1000;
    const xpNeeded = 1000; // Each level needs 1000 XP
    const percentage = Math.round((currentLevelXp / xpNeeded) * 100);

    return { current: currentLevelXp, total: xpNeeded, percentage };
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
                        {getTotalFocusTime()}
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
                              getTodaysFocusSessions().length >= 3
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {getTodaysFocusSessions().length}/3
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-sm">Finish 5 tasks</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              getTodaysTaskCount() >= 5
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {getTodaysTaskCount()}/5
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
                            {(stats.focusTime?.find((t) => {
                              const today = new Date();
                              const focusDate = new Date(t.date);
                              return (
                                focusDate.toDateString() ===
                                today.toDateString()
                              );
                            })?.duration || 0) + " / 60"}
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
                            +{Math.floor(getTotalFocusTime() / 10) * 5} XP
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
                <h3 className="text-lg font-medium mb-4">Focus Summary</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Total Sessions
                    </h4>
                    <p className="text-sm">
                      You've completed {getCompletedFocusSessions().length}{" "}
                      focus sessions out of {stats?.focusSessions?.length || 0}{" "}
                      total attempts.
                    </p>
                  </div>

                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Focus Time
                    </h4>
                    <p className="text-sm">
                      You've focused for a total of {getTotalFocusTime()}{" "}
                      minutes during this {timeRange}.
                    </p>
                  </div>

                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Today's Progress
                    </h4>
                    <p className="text-sm">
                      Today you've completed {getTodaysFocusSessions().length}{" "}
                      focus sessions and {getTodaysTaskCount()} tasks.
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
                          calculateTaskCompletionRate() * 2.51
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
                        {calculateTaskCompletionRate()}%
                      </span>
                      <span className="text-sm text-gray-400">Completion</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1E1E1E] p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium mb-4">Task Summary</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Total Completed
                    </h4>
                    <p className="text-sm">
                      You've completed {stats?.tasksCompleted || 0} tasks during
                      this {timeRange}.
                    </p>
                  </div>

                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Completion Rate
                    </h4>
                    <p className="text-sm">
                      Your current task completion rate is{" "}
                      {calculateTaskCompletionRate()}%.
                    </p>
                  </div>

                  <div className="p-4 bg-[#252525] rounded-lg">
                    <h4 className="text-md font-medium text-red-400 mb-2">
                      Current Streak
                    </h4>
                    <p className="text-sm">
                      You're on a {stats?.streakDays || 0}-day productivity
                      streak. Keep it up!
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
                {achievements.map((achievement) => {
                  const isCompleted = achievement.condition(stats);
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border ${
                        isCompleted
                          ? "bg-[#252525] border-yellow-500/30"
                          : "bg-[#1A1A1A] border-gray-700/30"
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="text-3xl mr-3">{achievement.icon}</div>
                        <div>
                          <h4
                            className={`font-bold ${
                              isCompleted ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {achievement.title}
                          </h4>
                          <p
                            className={`text-sm mt-1 ${
                              isCompleted ? "text-gray-300" : "text-gray-500"
                            }`}
                          >
                            {achievement.description}
                          </p>
                          <div
                            className={`mt-2 text-sm font-medium ${
                              isCompleted ? "text-yellow-400" : "text-gray-500"
                            }`}
                          >
                            {isCompleted
                              ? `+${achievement.xp} XP Earned!`
                              : `+${achievement.xp} XP`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
