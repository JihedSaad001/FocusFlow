import React, { useState } from "react";
import { Column as ColumnType, Task } from "../types";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface ColumnProps {
  column: ColumnType;
  onAddTask: (columnId: string, task: Task) => void;
  onDeleteTask: (taskId: string, columnId: string) => void;
  onUpdateColumn?: (columnId: string, title: string) => void;
}

const Column: React.FC<ColumnProps> = ({ column, onAddTask, onDeleteTask }) => {
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    priority: "Medium",
    icon: "📝",
  });

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        priority: newTask.priority as "Low" | "Medium" | "High",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        icon: newTask.icon,
      };

      onAddTask(column.id, task);
      setNewTask({
        title: "",
        priority: "Medium",
        icon: "📝",
      });
      setShowForm(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className="min-w-[300px] bg-[#1E1E1E] rounded-xl shadow-lg flex flex-col max-h-[calc(100vh-150px)] border border-gray-700"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 bg-red-500 rounded-t-xl">
        <div className="flex items-center">
          <h3 className="font-semibold text-white text-lg">{column.title}</h3>
          <span className="ml-3 bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            className="p-1 text-white hover:text-gray-300 transition"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4">
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.length > 0 ? (
            column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onDelete={onDeleteTask}
              />
            ))
          ) : (
            <div className="text-gray-500 text-center py-4">No tasks yet</div>
          )}
        </SortableContext>
      </div>

      {/* Add Task Form */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-4 rounded-b-xl border-t border-gray-700"
        >
          <input
            type="text"
            placeholder="Task title"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            autoFocus
          />

          <div className="flex gap-3 mt-3">
            <select
              className="p-3 bg-gray-700 border border-gray-600 rounded-lg flex-1 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  priority: e.target.value as "Low" | "Medium" | "High",
                })
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <select
              className="p-3 bg-gray-700 border border-gray-600 rounded-lg flex-1 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              value={newTask.icon}
              onChange={(e) => setNewTask({ ...newTask, icon: e.target.value })}
            >
              <option value="📝">📝 Note</option>
              <option value="🐛">🐛 Bug</option>
              <option value="✨">✨ Feature</option>
              <option value="🔄">🔄 Refactor</option>
              <option value="📱">📱 Mobile</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition"
            >
              Add Task
            </button>
          </div>
        </form>
      ) : (
        column.tasks.length === 0 && (
          <button
            className="w-full py-3 flex items-center justify-center text-gray-400 hover:bg-gray-700 rounded-b-xl border-t border-gray-700 transition"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} className="mr-2" />
            <span className="text-sm font-medium">Add Task</span>
          </button>
        )
      )}
    </div>
  );
};

export default Column;
