"use client";

import type React from "react";
import type { Task } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  columnId: string;
  onDelete: (taskId: string, columnId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, columnId, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { task, columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "To Do":
        return "text-gray-400";
      case "In Progress":
        return "text-yellow-400";
      case "Done":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-full bg-gray-800 rounded-lg shadow-md p-3 mb-2 cursor-grab active:cursor-grabbing border border-gray-700 hover:border-red-500 hover:shadow-lg transition-all duration-200 max-h-[180px] overflow-hidden"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start flex-1 min-w-0 mr-2">
          <span className="text-2xl mr-2 flex-shrink-0">
            {task.icon || "📝"}
          </span>
          <h3 className="font-medium text-gray-100 text-base break-words overflow-hidden line-clamp-2">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id, columnId);
            }}
            className="text-gray-400 hover:text-red-500 transition"
          >
            ×
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-gray-400 text-sm mb-2 overflow-hidden line-clamp-2 break-words">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority} {task.priority === "High" && "🔥"}
          </span>
          {task.status && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-700/50 ${getStatusColor(
                task.status
              )}`}
            >
              {task.status}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {task.finalEstimate && (
            <span className="text-xs text-red-400 font-semibold whitespace-nowrap">
              Est: {task.finalEstimate}
            </span>
          )}
          {task.assignedTo && (
            <span className="text-xs text-gray-400 truncate max-w-[100px]">
              Assigned: {task.assignedTo}
            </span>
          )}
          {task.deadline && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
