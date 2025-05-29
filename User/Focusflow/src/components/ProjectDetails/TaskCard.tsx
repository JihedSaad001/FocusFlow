
import { Trash2, UserCircle } from "lucide-react";
import {TaskCardProps } from "../../types";



const TaskCard = ({
  task,
  columnType,
  updateTaskStatus,
  deleteTaskFromSprint, 
  getMemberName,
}: TaskCardProps) => {
  const renderStatusButtons = () => {
    switch (columnType) {
      case "todo":
        return (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => updateTaskStatus(task._id, "In Progress")}
              className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
            >
              Start
            </button>
            <button
              onClick={() => updateTaskStatus(task._id, "Blocked")}
              className="text-red-400 hover:text-red-300 transition-colors text-sm"
            >
              Block
            </button>
          </div>
        );
      case "inProgress":
        return (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => updateTaskStatus(task._id, "Testing")}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              Test
            </button>
            <button
              onClick={() => updateTaskStatus(task._id, "Blocked")}
              className="text-red-400 hover:text-red-300 transition-colors text-sm"
            >
              Block
            </button>
            <button
              onClick={() => updateTaskStatus(task._id, "To Do")}
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              Move Back
            </button>
          </div>
        );
      case "testing":
        return (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => updateTaskStatus(task._id, "Done")}
              className="text-green-400 hover:text-green-300 transition-colors text-sm"
            >
              Complete
            </button>
            <button
              onClick={() => updateTaskStatus(task._id, "Blocked")}
              className="text-red-400 hover:text-red-300 transition-colors text-sm"
            >
              Block
            </button>
            <button
              onClick={() => updateTaskStatus(task._id, "In Progress")}
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              Move Back
            </button>
          </div>
        );
      case "blocked":
        return (
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={() => updateTaskStatus(task._id, "To Do")}
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              To Do
            </button>
            <button
              onClick={() => updateTaskStatus(task._id, "In Progress")}
              className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
            >
              In Progress
            </button>
          </div>
        );
      case "done":
        return (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => updateTaskStatus(task._id, "Testing")}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              Move to Testing
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col">
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4
          className="font-medium text-white truncate flex-1"
          title={task.title}
        >
          {task.title}
        </h4>
        {renderStatusButtons()}
      </div>
      <p className="text-gray-400 text-sm mb-3 flex-grow">{task.description}</p>
      {task.finalEstimate && (
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <span className="text-red-400 font-semibold">
            Estimate: {task.finalEstimate}
          </span>
        </div>
      )}
      {task.assignedTo && (
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <UserCircle className="w-4 h-4 mr-1" />
          Assigned to: {getMemberName(task.assignedTo)}
        </div>
      )}
      <button
        onClick={() => deleteTaskFromSprint(task._id)}
        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
      >
        <Trash2 className="w-4 h-4" /> Delete
      </button>
    </div>
  );
};

export default TaskCard;
