import { Trash2 } from "lucide-react";

interface Issue {
  _id: string; // Unique identifier for the issue
  title: string;
  description?: string;
  status?: string;
  votes?: { user: string; vote: string }[];
}

interface IssueListProps {
  issues: Issue[]; // Typed as an array of Issue objects
  onIssueSelect: (issue: Issue) => void; // Callback when an issue is selected
  currentIssueId?: string; // The ID of the currently selected issue
  onDeleteIssue: (id: string) => void; // Callback to delete an issue
}

export function IssueList({
  issues,
  onIssueSelect,
  currentIssueId,
  onDeleteIssue,
}: IssueListProps) {
  return (
    <div className="space-y-4">
      {issues.map((issue, index) => (
        <div
          key={issue._id || `issue-${index}`} // Use _id as key, fallback to index-based key
          onClick={() => onIssueSelect(issue)}
          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
            issue._id === currentIssueId
              ? "bg-red-500/10 border-red-500"
              : "bg-black/30 border-gray-700 hover:border-red-500/50"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white">{issue.title}</h3>
              {issue.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                  {issue.description}
                </p>
              )}
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
