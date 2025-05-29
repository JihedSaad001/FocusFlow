import type { Task } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  columnId: string;
  onDelete: (taskId: string, columnId: string) => void;
}

const TaskCard = ({ task, columnId, onDelete }: TaskCardProps) => {
  // This hook makes the card draggable
  const {
    attributes, // Accessibility attributes for screen readers
    listeners, // Mouse/touch event handlers for dragging
    setNodeRef, // Reference to connect this component to drag system
    transform, // Current position during drag (x, y coordinates)
    transition, // Smooth animation when dropping
    isDragging, // Boolean: true when this card is being dragged
  } = useSortable({
    id: task._id, // Unique ID for this draggable item
    data: { task, columnId }, // Extra data passed during drag events
  });

  // Convert drag position to CSS transform
  const style = {
    transform: CSS.Transform.toString(transform), // Apply drag position
    transition, // Apply smooth animations
    opacity: isDragging ? 0.5 : 1, // Make semi-transparent when dragging
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
      ref={setNodeRef} // Connect this div to the drag system
      style={style} // Apply drag position and opacity
      {...attributes} // Add accessibility attributes
      {...listeners} // Add drag event handlers (mouse/touch)
      className="w-full bg-gray-800 rounded-lg shadow-md p-3 mb-2 cursor-grab active:cursor-grabbing border border-gray-700 hover:border-red-500 hover:shadow-lg transition-all duration-200"
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
              e.stopPropagation(); // Prevent drag when clicking delete
              onDelete(task._id, columnId); // Call delete with both parameters
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
            {task.priority}
          </span>
          {task.status && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-700/50 text-gray-300">
              {task.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
