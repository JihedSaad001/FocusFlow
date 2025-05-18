import React from "react";
import { Users, UserCircle, UserMinus } from "lucide-react";
import { Project } from "../../types";

interface ProjectMembersProps {
  project: Project | null;
  isProjectOwner: boolean;
  handleRemoveMember: (memberId: string) => void;
}

const ProjectMembers: React.FC<ProjectMembersProps> = ({
  project,
  isProjectOwner,
  handleRemoveMember,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
        <Users className="w-6 h-6 mr-3 text-red-500" />
        Project Members ({project?.members.length || 0})
      </h2>
      {project?.members.length === 0 ? (
        <p className="text-gray-400 text-center">
          No members in this project yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {project?.members.map(
            (
              member: { _id: string; username: string; email: string },
              index: number
            ) => (
              <div
                key={`${member._id}-${index}`}
                className="bg-black/30 rounded-lg p-3 border border-gray-700/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">
                      {member.username}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {member.email}
                    </p>
                  </div>
                </div>
                {isProjectOwner && (
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1 transition-colors duration-200 whitespace-nowrap"
                  >
                    <UserMinus className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectMembers;
