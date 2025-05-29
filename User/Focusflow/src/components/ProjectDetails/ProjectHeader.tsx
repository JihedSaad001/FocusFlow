import { Folder, Users, UserCircle, UserPlus, PlayCircle } from "lucide-react";
import { Project } from "../../types";

interface ProjectHeaderProps {
  project: Project | null;
  showAddMember: boolean;
  setShowAddMember: (show: boolean) => void;
  handlePokerSession: () => void;
  memberEmail: string;
  setMemberEmail: (email: string) => void;
  handleAddMember: () => void;
  addMemberError: string | null;
  addMemberSuccess: string | null;
}

const ProjectHeader = ({
  project,
  showAddMember,
  setShowAddMember,
  handlePokerSession,
  memberEmail,
  setMemberEmail,
  handleAddMember,
  addMemberError,
  addMemberSuccess,
}: ProjectHeaderProps) => {
  return (
    <div className="border-b border-gray-700/50 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 flex items-center">
            <Folder className="w-8 h-8 mr-3 text-red-500" />
            {project?.name}
          </h1>
          <p className="text-gray-400 mt-2">{project?.description}</p>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center text-gray-300">
              <Users className="w-5 h-5 mr-2 text-red-500/70" />
              {project?.members.length || 0} Members
            </div>
            <div className="flex items-center text-gray-300">
              <UserCircle className="w-5 h-5 mr-2 text-red-500/70" />
              Created by {project?.owner?.username}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Member
          </button>
          <button
            onClick={handlePokerSession}
            className="bg-gradient-to-r from-red-500 to-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
          Go to Poker Session
          </button>
        </div>
      </div>
      {showAddMember && (
        <div className="mt-4 p-4 bg-black/30 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">
            Add Member to Project
          </h3>
          <div className="flex gap-4 items-center">
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Enter member's email"
              className="p-2 rounded-lg bg-black/50 border border-gray-700 text-white w-full"
            />
            <button
              onClick={handleAddMember}
              className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors text-white"
            >
              Add
            </button>
          </div>
          {addMemberError && (
            <p className="text-red-400 mt-2">{addMemberError}</p>
          )}
          {addMemberSuccess && (
            <p className="text-green-400 mt-2">{addMemberSuccess}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectHeader;
