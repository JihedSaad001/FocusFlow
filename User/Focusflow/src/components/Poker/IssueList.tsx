"use client";

import type { Issue } from "../../types";
import { CheckCircle, Eye, Clock } from "lucide-react";

interface IssueListProps {
  issues: Issue[];
  onIssueSelect: (issue: Issue) => void;
  currentIssueId?: string;
  onDeleteIssue: (issueId: string) => void;
}

export function IssueList({
  issues,
  onIssueSelect,
  currentIssueId,
  onDeleteIssue,
}: IssueListProps) {
  // Function to get status indicator
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "Revealed":
        return (
          <span title="Votes Revealed">
            <Eye size={16} className="text-yellow-400" aria-hidden="true" />
          </span>
        );
      case "Finished":
        return (
          <span title="Validated">
            <CheckCircle
              size={16}
              className="text-green-400"
              aria-hidden="true"
            />
          </span>
        );
      case "Not Started":
      default:
        return (
          <span title="Not Started">
            <Clock size={16} className="text-gray-400" aria-hidden="true" />
          </span>
        );
    }
  };

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div
          key={issue._id}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            currentIssueId === issue._id
              ? "bg-red-500/20 border border-red-500"
              : "bg-black/30 border border-gray-700 hover:bg-black/50"
          }`}
          onClick={() => onIssueSelect(issue)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {getStatusIndicator(issue.status)}
              <h3 className="text-white font-medium">{issue.title}</h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteIssue(issue._id);
              }}
              className="text-gray-400 hover:text-red-500 transition"
            >
              ×
            </button>
          </div>
          <p className="text-gray-400 text-sm">{issue.description}</p>
          {issue.deadline && (
            <div className="mt-1 text-xs text-gray-400 flex items-center">
              <Clock size={12} className="mr-1" />
              Due: {new Date(issue.deadline).toLocaleDateString()}
            </div>
          )}
          {issue.finalEstimate && (
            <div className="mt-2">
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                Estimate: {issue.finalEstimate}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default IssueList;
