import { Trash2 } from "lucide-react";
import { Issue } from "../../types"; // Import Issue from types.ts

interface IssueListProps {
  issues: Issue[]; // Use the imported Issue type
  onIssueSelect: (issue: Issue) => void; // Use the imported Issue type
  currentIssueId?: string;
  onDeleteIssue: (id: string) => void;
}

export function IssueList({
  issues,
  onIssueSelect,
  currentIssueId,
  onDeleteIssue,
}: IssueListProps) {
  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <div
          key={issue._id} // No need for fallback since _id is guaranteed
          onClick={() => onIssueSelect(issue)}
          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
            issue._id === currentIssueId
              ? "bg-red-500/10 border-red-500"
              : "bg-black/30 border-gray-700 hover:border-red-500/50"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-white truncate">{issue.title}</h3>
              {issue.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                  {issue.description}
                </p>
              )}
              <div className="flex justify-between items-center mt-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    issue.status === "Not Started"
                      ? "bg-gray-500/20 text-gray-400"
                      : issue.status === "Voting"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : issue.status === "Revealed"
                      ? "bg-blue-500/20 text-blue-400"
                      : issue.status === "Finished"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {issue.status || "Not Started"}
                </span>
                {issue.finalEstimate && (
                  <span className="text-xs text-red-400 font-semibold">
                    Est: {issue.finalEstimate}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-red-500 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering onIssueSelect
                  onDeleteIssue(issue._id);
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}
      {issues.length === 0 && (
        <p className="text-center text-gray-400 py-4">No issues added yet.</p>
      )}
    </div>
  );
}