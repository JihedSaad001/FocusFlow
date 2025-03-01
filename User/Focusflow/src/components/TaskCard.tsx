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
        return "bg-red-900/50 text-red-300";
      case "Medium":
        return "bg-yellow-900/50 text-yellow-300";
      case "Low":
        return "bg-green-900/50 text-green-300";
      default:
        return "bg-gray-800 text-gray-300";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-800 rounded-lg shadow p-4 mb-3 cursor-grab active:cursor-grabbing border border-gray-700"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-xl mr-2">{task.icon}</span>
          <h3 className="font-medium text-gray-200">{task.title}</h3>
        </div>
        <button
          onClick={() => onDelete(task.id, columnId)}
          className="text-gray-400 hover:text-red-500"
        >
          ×
        </button>
      </div>

      <div className="flex justify-between items-center">
        <span
          className={`text-xs px-2 py-1 rounded ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority} {task.priority === "High" && "🔥"}
        </span>
        <span className="text-xs text-gray-500">{task.date}</span>
      </div>
    </div>
  );
};

export default TaskCard;
