import { useState } from "react";

interface IssueFormProps {
  sessionId: string;
  onIssueAdded: () => void;
}

export function IssueForm({ sessionId, onIssueAdded }: IssueFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  console.log(
    "Session ID in IssueForm (full):",
    JSON.stringify(sessionId),
    "Length:",
    sessionId.length
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting with sessionId:", JSON.stringify(sessionId));
    const token = localStorage.getItem("token");
    const response = await fetch(
      `https://focusflow-production.up.railway.app/api/projects/${sessionId}/poker/issue`,
      {
        // Use direct backend URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      }
    );
    console.log("Response status:", response.status);
    if (response.ok) {
      setTitle("");
      setDescription("");
      setError(null);
      onIssueAdded();
    } else {
      const errorText = await response.text();
      console.error("Failed to add issue:", errorText);
      setError(`Failed to add issue: ${errorText}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400">{error}</p>}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Issue Title"
        className="w-full p-2 bg-black/30 border border-gray-700 rounded"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full p-2 bg-black/30 border border-gray-700 rounded"
      />
      <button
        type="submit"
        className="w-full py-2 bg-red-500 hover:bg-red-600 rounded transition-colors"
      >
        Add Issue
      </button>
    </form>
  );
}

export default IssueForm;
