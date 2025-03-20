import React from "react";
import { Task } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  columnId: string;
  onDelete: (taskId: string, columnId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, columnId, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id, data: { task, columnId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-900/70 text-red-200 border border-red-700";
      case "Medium":
        return "bg-yellow-900/70 text-yellow-200 border border-yellow-700";
      case "Low":
        return "bg-green-900/70 text-green-200 border border-green-700";
      default:
        return "bg-gray-800 text-gray-300 border border-gray-700";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-800 rounded-lg shadow-md p-4 mb-3 cursor-grab active:cursor-grabbing border border-gray-700 hover:border-red-500 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{task.icon}</span>
          <h3 className="font-medium text-gray-100 text-lg">{task.title}</h3>
        </div>
        <button
          onClick={() => onDelete(task.id, columnId)}
          className="text-gray-400 hover:text-red-500 transition"
        >
          ×
        </button>
      </div>

      <div className="flex justify-between items-center">
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority} {task.priority === "High" && "🔥"}
        </span>
        <span className="text-xs text-gray-400">{task.date}</span>
      </div>
    </div>
  );
};

export default TaskCard;
