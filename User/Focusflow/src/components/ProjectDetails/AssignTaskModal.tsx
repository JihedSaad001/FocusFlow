import React from "react";
import { Project, Task } from "../../types";

interface AssignTaskModalProps {
  project: Project | null;
  selectedTaskForAssignment: Task | null;
  selectedMemberForAssignment: string;
  setSelectedMemberForAssignment: (memberId: string) => void;
  setAssignTaskModalOpen: (open: boolean) => void;
  setSelectedTaskForAssignment: (task: Task | null) => void;
  handleAssignToKanban: (taskId: string, memberId: string) => void;
}

const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  project,
  selectedTaskForAssignment,
  selectedMemberForAssignment,
  setSelectedMemberForAssignment,
  setAssignTaskModalOpen,
  setSelectedTaskForAssignment,
  handleAssignToKanban,
}) => {
  if (!selectedTaskForAssignment) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] rounded-xl border border-gray-700 p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">
          Assign Task
        </h3>
        <p className="text-gray-300 mb-2">
          Task:{" "}
          <span className="font-semibold">
            {selectedTaskForAssignment.title}
          </span>
        </p>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Assign to</label>
          <select
            value={selectedMemberForAssignment}
            onChange={(e) => setSelectedMemberForAssignment(e.target.value)}
            className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
          >
            <option value="">Unassigned</option>
            {project?.members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.username}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setAssignTaskModalOpen(false);
              setSelectedTaskForAssignment(null);
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              handleAssignToKanban(
                selectedTaskForAssignment._id,
                selectedMemberForAssignment
              )
            }
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskModal;
