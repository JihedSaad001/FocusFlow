import React from "react";
import {
  ListTodo,
  Loader2,
  Bug,
  XCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from "lucide-react";
import { Sprint, Task } from "../../types";
import TaskCard from "./TaskCard";

interface SprintBoardProps {
  activeSprint: Sprint;
  showSprintBoard: boolean;
  setShowSprintBoard: (show: boolean) => void;
  updateTaskStatus: (
    taskId: string,
    status: "To Do" | "In Progress" | "Testing" | "Blocked" | "Done"
  ) => void;
  deleteTaskFromSprint: (taskId: string) => void;
  getMemberName: (memberId: string | undefined) => string;
}

const SprintBoard: React.FC<SprintBoardProps> = ({
  activeSprint,
  showSprintBoard,
  setShowSprintBoard,
  updateTaskStatus,
  deleteTaskFromSprint,
  getMemberName,
}) => {
  return (
    <div className="mt-6">
      <div
        className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
        onClick={() => setShowSprintBoard(!showSprintBoard)}
      >
        <div className="flex items-center">
          <ClipboardList className="w-6 h-6 mr-3 text-red-500" />
          <h2 className="text-2xl font-semibold">Sprint Board</h2>
        </div>
        {showSprintBoard ? <ChevronUp /> : <ChevronDown />}
      </div>

      {showSprintBoard && (
        <div className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[minmax(300px,1fr)] gap-6 pb-4">
            {/* To Do Column */}
            <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <ListTodo className="w-5 h-5 mr-2 text-gray-400" />
                To Do
              </h3>
              <div className="space-y-3">
                {activeSprint.tasks
                  .filter((t: Task) => t.status === "To Do")
                  .map((task: Task) => (
                    <TaskCard
                      key={`todo-${task._id}`}
                      task={task}
                      columnType="todo"
                      updateTaskStatus={updateTaskStatus}
                      deleteTaskFromSprint={deleteTaskFromSprint}
                      getMemberName={getMemberName}
                    />
                  ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Loader2 className="w-5 h-5 mr-2 text-yellow-500" />
                In Progress
              </h3>
              <div className="space-y-3">
                {activeSprint.tasks
                  .filter((t: Task) => t.status === "In Progress")
                  .map((task: Task) => (
                    <TaskCard
                      key={`inprogress-${task._id}`}
                      task={task}
                      columnType="inProgress"
                      updateTaskStatus={updateTaskStatus}
                      deleteTaskFromSprint={deleteTaskFromSprint}
                      getMemberName={getMemberName}
                    />
                  ))}
              </div>
            </div>

            {/* Testing Column */}
            <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Bug className="w-5 h-5 mr-2 text-purple-500" />
                Testing
              </h3>
              <div className="space-y-3">
                {activeSprint.tasks
                  .filter((t: Task) => t.status === "Testing")
                  .map((task: Task) => (
                    <TaskCard
                      key={`testing-${task._id}`}
                      task={task}
                      columnType="testing"
                      updateTaskStatus={updateTaskStatus}
                      deleteTaskFromSprint={deleteTaskFromSprint}
                      getMemberName={getMemberName}
                    />
                  ))}
              </div>
            </div>

            {/* Blocked Column */}
            <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-red-500" />
                Blocked
              </h3>
              <div className="space-y-3">
                {activeSprint.tasks
                  .filter((t: Task) => t.status === "Blocked")
                  .map((task: Task) => (
                    <TaskCard
                      key={`blocked-${task._id}`}
                      task={task}
                      columnType="blocked"
                      updateTaskStatus={updateTaskStatus}
                      deleteTaskFromSprint={deleteTaskFromSprint}
                      getMemberName={getMemberName}
                    />
                  ))}
              </div>
            </div>

            {/* Done Column */}
            <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-green-500" />
                Done
              </h3>
              <div className="space-y-3">
                {activeSprint.tasks
                  .filter((t: Task) => t.status === "Done")
                  .map((task: Task) => (
                    <TaskCard
                      key={`done-${task._id}`}
                      task={task}
                      columnType="done"
                      updateTaskStatus={updateTaskStatus}
                      deleteTaskFromSprint={deleteTaskFromSprint}
                      getMemberName={getMemberName}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintBoard;
