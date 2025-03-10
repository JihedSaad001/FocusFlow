import React, { useState } from "react";
import { Column as ColumnType, Task } from "../types";
import TaskCard from "./TaskCard";
import { Plus, MoreHorizontal, Check, X, Edit2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface ColumnProps {
  column: ColumnType;
  onAddTask: (columnId: string, task: Task) => void;
  onDeleteTask: (taskId: string, columnId: string) => void;
  onUpdateColumn: (columnId: string, title: string) => void;
}

const Column: React.FC<ColumnProps> = ({
  column,
  onAddTask,
  onDeleteTask,
  onUpdateColumn,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    priority: "Medium",
    icon: "📝",
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);

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

  const handleTitleSubmit = () => {
    onUpdateColumn(column.id, columnTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setColumnTitle(column.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className="min-w-[300px] bg-[#1E1E1E] rounded-md p-3 flex flex-col max-h-[calc(100vh-200px)]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {isEditingTitle ? (
            <div className="flex items-center">
              <input
                type="text"
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                autoFocus
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 text-green-500 hover:text-green-400 ml-1"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setColumnTitle(column.title);
                  setIsEditingTitle(false);
                }}
                className="p-1 text-red-500 hover:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-medium text-gray-300">{column.title}</h3>
              <span className="ml-2 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">
                {column.tasks.length}
              </span>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-1 text-gray-400 hover:text-gray-300 ml-1"
              >
                <Edit2 size={14} />
              </button>
            </>
          )}
        </div>
        <div className="flex">
          <button className="p-1 text-gray-400 hover:text-gray-300">
            <MoreHorizontal size={16} />
          </button>
          <button
            className="p-1 text-gray-400 hover:text-gray-300"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-3 rounded-lg shadow mt-3"
        >
          <input
            type="text"
            placeholder="Task title"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded mb-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            autoFocus
          />

          <div className="flex mb-2">
            <select
              className="p-2 bg-gray-700 border border-gray-600 rounded mr-2 flex-1 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
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
              className="p-2 bg-gray-700 border border-gray-600 rounded flex-1 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
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

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded"
            >
              Add
            </button>
          </div>
        </form>
      ) : (
        column.tasks.length === 0 && (
          <button
            className="w-full py-2 flex items-center justify-center text-gray-400 hover:bg-gray-800 rounded"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} className="mr-1" />
            <span className="text-sm">New</span>
          </button>
        )
      )}
    </div>
  );
};

export default Column;
