import React from "react";
import { ListTodo, Plus, ChevronDown, ChevronUp, Calendar, Trash2, CheckCircle } from "lucide-react";
import { Project, Task } from "../../types";

interface BacklogSectionProps {
  project: Project | null;
  showBacklog: boolean;
  setShowBacklog: (show: boolean) => void;
  newTask: {
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High";
    assignedTo: string;
    deadline: string;
  };
  setNewTask: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High";
    assignedTo: string;
    deadline: string;
  }>>;
  addTaskToBacklog: () => void;
  deleteTaskFromBacklog: (taskId: string) => void;
}

const BacklogSection: React.FC<BacklogSectionProps> = ({
  project,
  showBacklog,
  setShowBacklog,
  newTask,
  setNewTask,
  addTaskToBacklog,
  deleteTaskFromBacklog,
}) => {
  return (
    <div className="mb-8">
      <div
        className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
        onClick={() => setShowBacklog(!showBacklog)}
      >
        <div className="flex items-center">
          <ListTodo className="w-6 h-6 mr-3 text-red-500" />
          <h2 className="text-2xl font-semibold">Backlog</h2>
        </div>
        {showBacklog ? <ChevronUp /> : <ChevronDown />}
      </div>

      {showBacklog && (
        <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Items added to the backlog are automatically available in
              poker planning for estimation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              placeholder="Task Title"
              className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
            />
            <input
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              placeholder="Task Description"
              className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
            />
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  priority: e.target.value as "Low" | "Medium" | "High",
                })
              }
              className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
            <input
              type="date"
              value={newTask.deadline}
              onChange={(e) =>
                setNewTask({ ...newTask, deadline: e.target.value })
              }
              placeholder="Due Date"
              className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
            />
            <button
              onClick={addTaskToBacklog}
              className="md:col-span-2 bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-800"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>

          {project?.backlog.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-black/30 rounded-full mx-auto flex items-center justify-center mb-4">
                <ListTodo className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-400 text-lg">
                No tasks in the backlog yet.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Add your first task to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="bg-black/30 rounded-t-lg p-3 grid grid-cols-12 gap-4 text-gray-400 text-sm font-medium">
                <div className="col-span-5">Task</div>
                <div className="col-span-3">Priority</div>
                <div className="col-span-2">Estimate</div>
                <div className="col-span-2">Actions</div>
              </div>
              <div className="space-y-1 mt-1">
                {project?.backlog.map((task: Task) => (
                  <div
                    key={`backlog-${task._id}`}
                    className="bg-black/20 hover:bg-black/30 p-3 rounded-lg grid grid-cols-12 gap-4 items-center transition-colors"
                  >
                    <div className="col-span-5">
                      <h3 className="font-medium text-white truncate">
                        {task.title}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {task.description}
                      </p>
                      {task.deadline && (
                        <div className="flex items-center text-gray-500 text-xs mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="col-span-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === "High"
                            ? "bg-red-500/20 text-red-400"
                            : task.priority === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div className="col-span-2">
                      {task.finalEstimate ? (
                        <span className="text-red-400 font-semibold">
                          {task.finalEstimate}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Not estimated
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => deleteTaskFromBacklog(task._id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BacklogSection;
