import React, { useState } from "react";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Plus,
  Calendar,
  ArrowRight,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Project, Sprint } from "../../types";
import SprintBoard from "./SprintBoard";

interface SprintSectionProps {
  project: Project | null;
  showSprintPlanning: boolean;
  setShowSprintPlanning: (show: boolean) => void;
  showSprintBoard: boolean;
  setShowSprintBoard: (show: boolean) => void;
  newSprint: {
    name: string;
    startDate: string;
    endDate: string;
    goals: string[];
  };
  setNewSprint: React.Dispatch<
    React.SetStateAction<{
      name: string;
      startDate: string;
      endDate: string;
      goals: string[];
    }>
  >;
  createSprint: () => void;
  deleteSprint: (sprintId: string) => void;
  activeSprint: Sprint | null;
  setActiveSprint: React.Dispatch<React.SetStateAction<Sprint | null>>;
  updateTaskStatus: (
    taskId: string,
    status: "To Do" | "In Progress" | "Testing" | "Blocked" | "Done"
  ) => void;
  deleteTaskFromSprint: (taskId: string) => void;
  getMemberName: (memberId: string | undefined) => string;
}

const SprintSection: React.FC<SprintSectionProps> = ({
  project,
  showSprintPlanning,
  setShowSprintPlanning,
  showSprintBoard,
  setShowSprintBoard,
  newSprint,
  setNewSprint,
  createSprint,
  deleteSprint,
  activeSprint,
  setActiveSprint,
  updateTaskStatus,
  deleteTaskFromSprint,
  getMemberName,
}) => {
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);

  // Calculate date limits
  const today = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format

  // Calculate max date (2 years from now for sprints)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Handle start date change with validation
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;

    // Clear previous error
    setStartDateError(null);

    // Validate the date
    const selectedDateObj = new Date(selectedDate);
    const todayObj = new Date(today);

    // Check if date is in the past
    if (selectedDateObj < todayObj) {
      setStartDateError("Cannot start a sprint in the past");
      return;
    }

    // Check if date is too far in the future
    if (selectedDateObj > maxDate) {
      setStartDateError("Start date is too far in the future (max 2 years)");
      return;
    }

    // If valid, update the sprint
    setNewSprint({ ...newSprint, startDate: selectedDate });

    // If end date is set and now earlier than start date, clear it
    if (newSprint.endDate && new Date(newSprint.endDate) < selectedDateObj) {
      setNewSprint({ ...newSprint, startDate: selectedDate, endDate: "" });
      setEndDateError("End date must be after start date");
    }
  };

  // Handle end date change with validation
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;

    // Clear previous error
    setEndDateError(null);

    // Validate the date
    const selectedDateObj = new Date(selectedDate);
    const startDateObj = newSprint.startDate
      ? new Date(newSprint.startDate)
      : new Date(today);

    // Check if end date is before start date
    if (selectedDateObj < startDateObj) {
      setEndDateError("End date must be after start date");
      return;
    }

    // Check if sprint duration is too long (max 6 months)
    const sixMonthsLater = new Date(startDateObj);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    if (selectedDateObj > sixMonthsLater) {
      setEndDateError("Sprint duration cannot exceed 6 months");
      return;
    }

    // If valid, update the sprint
    setNewSprint({ ...newSprint, endDate: selectedDate });
  };
  return (
    <div className="mb-8">
      <div
        className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
        onClick={() => setShowSprintPlanning(!showSprintPlanning)}
      >
        <div className="flex items-center">
          <Target className="w-6 h-6 mr-3 text-red-500" />
          <h2 className="text-2xl font-semibold">Sprint Planning</h2>
        </div>
        {showSprintPlanning ? <ChevronUp /> : <ChevronDown />}
      </div>

      {showSprintPlanning && (
        <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
          {/* Always show the sprint creation form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              value={newSprint.name}
              onChange={(e) =>
                setNewSprint({ ...newSprint, name: e.target.value })
              }
              placeholder="Sprint Name"
              className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={newSprint.startDate}
                  onChange={handleStartDateChange}
                  min={today}
                  max={maxDateStr}
                  className={`w-full bg-black/50 text-white p-3 rounded-lg border ${
                    startDateError ? "border-red-500" : "border-gray-700"
                  } focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200`}
                />
                {startDateError && (
                  <p className="text-red-500 text-sm mt-1">{startDateError}</p>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={newSprint.endDate}
                  onChange={handleEndDateChange}
                  min={newSprint.startDate || today}
                  max={maxDateStr}
                  className={`w-full bg-black/50 text-white p-3 rounded-lg border ${
                    endDateError ? "border-red-500" : "border-gray-700"
                  } focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200`}
                />
                {endDateError && (
                  <p className="text-red-500 text-sm mt-1">{endDateError}</p>
                )}
              </div>
            </div>
            <input
              value={newSprint.goals[0]}
              onChange={(e) =>
                setNewSprint({
                  ...newSprint,
                  goals: [e.target.value],
                })
              }
              placeholder="Sprint Goal"
              className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
            />
            <button
              onClick={createSprint}
              className="bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Sprint
            </button>
          </div>

          {/* Display existing sprints */}
          {project?.sprints && project.sprints.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Existing Sprints
              </h3>
              <div className="space-y-4">
                {project.sprints.map((sprint) => (
                  <div key={sprint._id} className="bg-black/20 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white">
                        {sprint.name} {sprint.active ? "(Active)" : ""}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Set this sprint as active
                            setActiveSprint(sprint);
                          }}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 px-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Set Active
                        </button>
                        <button
                          onClick={() => deleteSprint(sprint._id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 px-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(sprint.startDate || "").toLocaleDateString()}
                      </div>
                      <ArrowRight className="w-4 h-4" />
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(sprint.endDate || "").toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {sprint.goals.map((goal: string, index: number) => (
                        <div
                          key={`${sprint._id}-goal-${index}`}
                          className="flex items-center gap-2 text-gray-300"
                        >
                          <Target className="w-4 h-4 text-red-500" />
                          <span>{goal || "No goal"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Show Sprint Board directly under the selected sprint */}
                    {activeSprint && activeSprint._id === sprint._id && (
                      <SprintBoard
                        activeSprint={activeSprint}
                        showSprintBoard={showSprintBoard}
                        setShowSprintBoard={setShowSprintBoard}
                        updateTaskStatus={updateTaskStatus}
                        deleteTaskFromSprint={deleteTaskFromSprint}
                        getMemberName={getMemberName}
                      />
                    )}
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

export default SprintSection;
