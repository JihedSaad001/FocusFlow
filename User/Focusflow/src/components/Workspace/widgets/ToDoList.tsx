"use client";

import { useState, useEffect, useRef } from "react"; // Add useRef
import { Plus, X, Check, Trash2, Loader2 } from "lucide-react";
import Draggable from "react-draggable"; // Import react-draggable
import axios from "axios";

interface ToDoListProps {
  onClose: () => void;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ToDoList = ({ onClose }: ToDoListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Create a ref for the draggable node
  const nodeRef = useRef<HTMLDivElement>(null);

  // Load tasks when component mounts
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication required");
        }

        // Try to fetch from API
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/todo-tasks`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();

          if (data && data.tasks) {
            // Transform the data to match our Task interface
            const formattedTasks = data.tasks.map((task: any) => ({
              id: task._id,
              text: task.title,
              completed: task.completed,
            }));

            setTasks(formattedTasks);
            setUseLocalStorage(false);
          } else {
            throw new Error("Invalid data format");
          }
        } catch (apiError) {
          console.error("API error, falling back to localStorage:", apiError);

          // Fallback to localStorage
          const savedTasks = localStorage.getItem("todoTasks");
          if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
          }
          setUseLocalStorage(true);
        }
      } catch (error: any) {
        console.error("Error fetching tasks:", error);
        setError(error.message);

        // Try to load from localStorage as last resort
        const savedTasks = localStorage.getItem("todoTasks");
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
        setUseLocalStorage(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    // Always save to localStorage as backup
    localStorage.setItem("todoTasks", JSON.stringify(tasks));

    // If we're using API, also save there
    if (!useLocalStorage) {
      const saveTasks = async () => {
        try {
          const token = localStorage.getItem("token");

          if (!token) {
            setError("Authentication required");
            return;
          }

          // Format tasks for the API
          const tasksForApi = tasks.map((task) => ({
            _id: task.id,
            title: task.text,
            completed: task.completed,
          }));

          const response = await fetch(`${API_BASE_URL}/api/user/todo-tasks`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tasks: tasksForApi }),
          });

          if (!response.ok) {
            console.error("API save failed, using localStorage only");
            setUseLocalStorage(true);
          }
        } catch (error) {
          console.error("Error saving tasks to API:", error);
          setUseLocalStorage(true);
        }
      };

      saveTasks();
    }
  }, [tasks, isLoading, useLocalStorage]);

  // ✅ Add New Task
  const addTask = () => {
    if (newTask.trim() !== "") {
      const newTaskObj = {
        id: Date.now().toString(), // Use timestamp as ID
        text: newTask,
        completed: false,
      };

      setTasks([...tasks, newTaskObj]);
      setNewTask("");
    }
  };

  // ✅ Toggle Task Completion
  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const wasCompleted = task?.completed;

    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );

    // If task is being marked as completed (not uncompleted), log it
    if (task && !wasCompleted) {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Create axios instance with default config
          const api = axios.create({
            baseURL:
              import.meta.env.VITE_API_URL || "http://localhost:5000/api",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          // Log completed task
          await api.post("/user/log-completed-task", { taskId: id });
          console.log("Task completion logged:", task.text);
        }
      } catch (error) {
        console.error("Failed to log completed task:", error);
      }
    }
  };

  // ✅ Remove Task
  const removeTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds="body">
      <div
        ref={nodeRef}
        className="fixed w-[460px] bg-[#121212] text-white border-2 border-[#ff4e50] rounded-xl shadow-2xl p-6 z-[50]"
      >
        {/* Header (Draggable) */}
        <div className="flex justify-between items-center drag-handle cursor-move mb-4">
          <h3 className="text-lg font-semibold">To-Do List</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Section */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
            className="flex-1 px-3 py-2 bg-[#252525] rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            onClick={addTask}
            className="px-3 py-2 bg-[#D42F2F] rounded-lg text-sm transition-all hover:bg-[#E14444]"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Mode Indicator */}
        {useLocalStorage && (
          <div className="bg-yellow-900/30 text-yellow-300 p-2 rounded-md mb-3 text-xs">
            Using local storage mode (changes won't sync across devices)
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 text-red-300 p-2 rounded-md mb-3 text-sm">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex justify-between mb-3 text-sm">
          <span className="text-gray-400">{tasks.length} tasks</span>
          <div className="flex space-x-3">
            {["All", "Pending", "Done"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedFilter === filter
                    ? "bg-[#D42F2F] text-white"
                    : "bg-[#252525] text-gray-300 hover:bg-[#353535]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No tasks yet. Add one above!
            </p>
          ) : (
            tasks
              .filter((task) =>
                selectedFilter === "All"
                  ? true
                  : selectedFilter === "Done"
                  ? task.completed
                  : !task.completed
              )
              .map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-3 py-2 bg-[#252525] rounded-lg"
                >
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`p-2 rounded-full ${
                      task.completed ? "bg-green-500" : "bg-gray-600"
                    } transition-all`}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </button>
                  <span
                    className={`flex-1 mx-2 text-sm ${
                      task.completed
                        ? "line-through text-gray-500"
                        : "text-white"
                    }`}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-red-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default ToDoList;
