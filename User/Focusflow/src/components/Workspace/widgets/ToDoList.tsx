"use client";

import { useState, useEffect } from "react";
import { Plus, X, Check, Trash2 } from "lucide-react";
import { useDraggable } from "./../hooks/use-draggable";
import { logCompletedTask } from "../../../Api";

interface ToDoListProps {
  onClose: () => void;
}

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const ToDoList = ({ onClose }: ToDoListProps) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem("todoTasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Use our custom draggable hook
  const { position, handleMouseDown, isDragging } = useDraggable({
    initialPosition: { x: window.innerWidth - 580, y: 50 },
    boundaryPadding: 10,
  });

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
  }, [tasks]);

  // ✅ Add New Task
  const addTask = () => {
    if (newTask.trim() !== "") {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask("");
    }
  };

  // ✅ Toggle Task Completion
  const toggleTaskCompletion = async (id: number) => {
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
          await logCompletedTask(token, id.toString());
          console.log("Task completion logged:", task.text);
        }
      } catch (error) {
        console.error("Failed to log completed task:", error);
      }
    }
  };

  // ✅ Remove Task
  const removeTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
        transition: isDragging ? "none" : "transform 0.1s ease-out",
      }}
      className="fixed w-[460px] bg-[#121212] text-white border-3 border-[#ff4e50] rounded-xl shadow-2xl p-6 transition-all cursor-grab active:cursor-grabbing"
    >
      {/* Header (Draggable) */}
      <div
        className="flex justify-between items-center cursor-grab active:cursor-grabbing mb-4"
        onMouseDown={handleMouseDown}
      >
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
        {tasks
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
                  task.completed ? "line-through text-gray-500" : "text-white"
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
          ))}
      </div>
    </div>
  );
};

export default ToDoList;
