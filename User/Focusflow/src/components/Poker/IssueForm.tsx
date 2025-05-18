"use client";

import type React from "react";

import { useState } from "react";

interface IssueFormProps {
  sessionId: string;
  onIssueAdded: () => void;
}

export function IssueForm({ sessionId, onIssueAdded }: IssueFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate date limits
  const today = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format

  // Calculate max date (3 years from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 3);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  console.log(
    "Session ID in IssueForm (full):",
    JSON.stringify(sessionId),
    "Length:",
    sessionId.length
  );

  // Handle date change with validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;

    // Clear previous error
    setDateError(null);

    // Validate the date
    const selectedDateObj = new Date(selectedDate);
    const todayObj = new Date(today);

    // Check if date is in the past
    if (selectedDateObj < todayObj) {
      setDateError("Cannot set a deadline in the past");
      return;
    }

    // Check if date is too far in the future
    if (selectedDateObj > maxDate) {
      setDateError("Deadline is too far in the future (max 3 years)");
      return;
    }

    // If valid, update the deadline
    setDeadline(selectedDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !title.trim()) return;

    // Validate date before submission
    if (dateError) {
      setError("Please fix the date error before submitting");
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting with sessionId:", JSON.stringify(sessionId));
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${sessionId}/poker/issue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, description, deadline }),
        }
      );

      console.log("Response status:", response.status);

      if (response.ok) {
        setTitle("");
        setDescription("");
        setDeadline("");
        setError(null);
        onIssueAdded();
      } else {
        const errorText = await response.text();
        console.error("Failed to add issue:", errorText);
        setError(`Failed to add issue: ${errorText}`);
      }
    } catch (error: any) {
      console.error("Error submitting issue:", error);
      setError(`Error submitting issue: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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
        disabled={isSubmitting}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full p-2 bg-black/30 border border-gray-700 rounded"
        disabled={isSubmitting}
      />
      <div className="mt-4">
        <label className="block text-gray-300 mb-2 text-sm">Due Date</label>
        <input
          type="date"
          value={deadline}
          onChange={handleDateChange}
          min={today}
          max={maxDateStr}
          className={`w-full p-2 bg-black/30 border ${
            dateError ? "border-red-500" : "border-gray-700"
          } rounded`}
          disabled={isSubmitting}
        />
        {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
      </div>
      <button
        type="submit"
        className={`w-full py-2 ${
          isSubmitting ? "bg-gray-500" : "bg-red-500 hover:bg-red-600"
        } rounded transition-colors`}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Adding..." : "Add Issue"}
      </button>
    </form>
  );
}

export default IssueForm;
