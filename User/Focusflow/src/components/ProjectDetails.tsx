import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Folder,
  Loader2,
  Users,
  FileText,
  Plus,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Calendar,
  Target,
  ListTodo,
  ClipboardList,
  UserCircle,
  ArrowRight,
  Trash2,
} from "lucide-react";

// Define interfaces for type safety
interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  assignedTo?: string;
  deadline?: string;
  status?: "To Do" | "In Progress" | "Done";
}

interface Sprint {
  _id: string;
  name: string;
  tasks: Task[];
  active: boolean;
  startDate?: string;
  endDate?: string;
  goals: string[];
  reviewNotes?: string[];
  retrospectiveNotes?: string[];
}

interface Project {
  _id: string;
  name: string;
  description: string;
  owner: { _id: string; username: string };
  members: { _id: string; username: string; email: string }[];
  backlog: Task[];
  sprints: Sprint[];
}

function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium" as "Low" | "Medium" | "High",
    assignedTo: "",
    deadline: "",
  });
  const [newSprint, setNewSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
    goals: [""],
  });
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [retrospectiveNote, setRetrospectiveNote] = useState("");
  const [showBacklog, setShowBacklog] = useState(true);
  const [showSprintPlanning, setShowSprintPlanning] = useState(true);
  const [showSprintBoard, setShowSprintBoard] = useState(true);
  const [showSprintReview, setShowSprintReview] = useState(true);
  const [showSprintRetrospective, setShowSprintRetrospective] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found, redirecting to login.");
        navigate("/signin");
        return;
      }
      try {
        const response = await fetch(
          `https://focusflow-production.up.railway.app/api/projects/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        setProject(data);
        const active = data.sprints?.find((s: Sprint) => s.active);
        setActiveSprint(active || null);
      } catch (error: any) {
        console.error("❌ Error fetching project:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  const addTaskToBacklog = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/backlog`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newTask),
        }
      );
      if (!response.ok) throw new Error("Failed to add task");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setNewTask({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
        deadline: "",
      });
    } catch (error: any) {
      console.error("❌ Error adding task:", error);
      setError("Error adding task to backlog.");
    }
  };

  const deleteTaskFromBacklog = async (taskId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/backlog/${taskId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete task");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
    } catch (error: any) {
      console.error("❌ Error deleting task:", error);
      setError("Error deleting task from backlog.");
    }
  };

  const createSprint = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newSprint),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create sprint: ${errorText}`);
      }
      const data = await response.json();
      console.log("API Response from createSprint:", data); // Debug log to check the response
      // If the API returns the full project object, use data directly
      setProject((prev) => ({
        ...prev,
        ...data, // Merge the entire updated project
        members: prev?.members || [], // Preserve members
      }));
      // Find the newly created sprint (it should be the last one if the API appends it)
      const newSprintData = data.sprint;
      setActiveSprint(newSprintData);
      setNewSprint({ name: "", startDate: "", endDate: "", goals: [""] });
    } catch (error: any) {
      console.error("❌ Error creating sprint:", error);
      setError(`Error creating sprint: ${error.message}`);
    }
  };
  const deleteSprint = async (sprintId: string) => {
    if (!window.confirm("Are you sure you want to delete this sprint?")) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${sprintId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete sprint");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setActiveSprint(null);
    } catch (error: any) {
      console.error("❌ Error deleting sprint:", error);
      setError("Error deleting sprint.");
    }
  };

  const addTaskToSprint = async (
    taskId: string,
    assignedTo: string,
    deadline: string
  ) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint?._id}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ taskId, assignedTo, deadline }),
        }
      );
      if (!response.ok) throw new Error("Failed to add task to sprint");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint?._id
        ) || null
      );
    } catch (error: any) {
      console.error("❌ Error adding task to sprint:", error);
      setError("Error adding task to sprint.");
    }
  };

  const deleteTaskFromSprint = async (taskId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint?._id}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete task");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint?._id
        ) || null
      );
    } catch (error: any) {
      console.error("❌ Error deleting task:", error);
      setError("Error deleting task from sprint.");
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    status: "To Do" | "In Progress" | "Done"
  ) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint?._id}/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error("Failed to update task status");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint?._id
        ) || null
      );
    } catch (error: any) {
      console.error("❌ Error updating task status:", error);
      setError("Error updating task status.");
    }
  };

  const addReviewNote = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint?._id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ note: reviewNote }),
        }
      );
      if (!response.ok) throw new Error("Failed to add review note");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint?._id
        ) || null
      );
      setReviewNote("");
    } catch (error: any) {
      console.error("❌ Error adding review note:", error);
      setError("Error adding review note.");
    }
  };

  const deleteReviewNote = async (noteIndex: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint?._id}/review/${noteIndex}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete review note");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint?._id
        ) || null
      );
    } catch (error: any) {
      console.error("❌ Error deleting review note:", error);
      setError("Error deleting review note.");
    }
  };

  const addRetrospectiveNote = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint?._id}/retrospective`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ note: retrospectiveNote }),
        }
      );
      if (!response.ok) throw new Error("Failed to add retrospective note");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint?._id
        ) || null
      );
      setRetrospectiveNote("");
    } catch (error: any) {
      console.error("❌ Error adding retrospective note:", error);
      setError("Error adding retrospective note.");
    }
  };

  const deleteRetrospectiveNote = async (noteIndex: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint?._id}/retrospective/${noteIndex}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete retrospective note");
      const updatedProject = await response.json();
      setProject((prev) => ({
        ...prev,
        ...updatedProject,
        members: prev?.members || [],
      }));
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint?._id
        ) || null
      );
    } catch (error: any) {
      console.error("❌ Error deleting retrospective note:", error);
      setError("Error deleting retrospective note.");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <p className="text-gray-400 mt-4">Loading project details...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-lg w-full">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Project Header */}
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
            </div>
          </div>

          <div className="p-8">
            {/* Backlog Section */}
            <div className="mb-8">
              <div
                className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
                onClick={() => setShowBacklog(!showBacklog)}
              >
                <div className="flex items-center">
                  <ListTodo className="w-6 h-6 mr-3 text-red-500" />
                  <h2 className="text-2xl font-semibold">Backlog</h2>
                </div>
                {showBacklog ? <ChevronUp /> : <ChevronDown />}
              </div>

              {showBacklog && (
                <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
                  {/* Input Form */}
                  <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
                    <input
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      placeholder="Task Title"
                      className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                    />
                    <input
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                      placeholder="Description"
                      className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                    />
                    <select
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          priority: e.target.value as "Low" | "Medium" | "High",
                        })
                      }
                      className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                    <input
                      value={newTask.assignedTo}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assignedTo: e.target.value })
                      }
                      placeholder="Assigned To (User ID)"
                      className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                    />
                    <input
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) =>
                        setNewTask({ ...newTask, deadline: e.target.value })
                      }
                      className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                    />
                    <button
                      onClick={addTaskToBacklog}
                      className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Add
                    </button>
                  </div>

                  {/* Task Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {project?.backlog.map((task: Task) => (
                      <div
                        key={task._id}
                        className="bg-black/30 rounded-lg p-4 border border-gray-700/50 hover:border-red-500/50 transition-all duration-200 flex flex-col min-w-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-white truncate">
                            {task.title}
                          </h3>
                          <span
                            className={`text-sm px-2 py-1 rounded ${
                              task.priority === "High"
                                ? "bg-red-500/20 text-red-400"
                                : task.priority === "Medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3 flex-grow overflow-hidden text-ellipsis">
                          {task.description}
                        </p>
                        {task.deadline && (
                          <div className="flex items-center text-gray-500 text-sm mb-3">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </div>
                        )}
                        {task.assignedTo && (
                          <div className="flex items-center text-gray-500 text-sm mb-3">
                            <UserCircle className="w-4 h-4 mr-1" />
                            Assigned to: {task.assignedTo}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {activeSprint && (
                            <button
                              onClick={() =>
                                addTaskToSprint(
                                  task._id,
                                  task.assignedTo || "",
                                  task.deadline || ""
                                )
                              }
                              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 min-w-[120px]"
                            >
                              Add to Sprint <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteTaskFromBacklog(task._id)}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 min-w-[120px]"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sprint Planning Section */}
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
                  {!activeSprint ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={newSprint.name}
                        onChange={(e) =>
                          setNewSprint({ ...newSprint, name: e.target.value })
                        }
                        placeholder="Sprint Name"
                        className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                      />
                      <div className="flex gap-4">
                        <input
                          type="date"
                          value={newSprint.startDate}
                          onChange={(e) =>
                            setNewSprint({
                              ...newSprint,
                              startDate: e.target.value,
                            })
                          }
                          className="flex-1 bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                        />
                        <input
                          type="date"
                          value={newSprint.endDate}
                          onChange={(e) =>
                            setNewSprint({
                              ...newSprint,
                              endDate: e.target.value,
                            })
                          }
                          className="flex-1 bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                        />
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
                  ) : (
                    <div className="bg-black/20 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-white">
                          {activeSprint.name}
                        </h3>
                        <button
                          onClick={() => deleteSprint(activeSprint._id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 px-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Sprint
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(
                            activeSprint.startDate || ""
                          ).toLocaleDateString()}
                        </div>
                        <ArrowRight className="w-4 h-4" />
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(
                            activeSprint.endDate || ""
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {activeSprint.goals.map(
                          (goal: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-gray-300"
                            >
                              <Target className="w-4 h-4 text-red-500" />
                              <span>{goal || "No goal"}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sprint Board Section */}
            {activeSprint && (
              <div className="mb-8">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* To Do Column */}
                    <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <ListTodo className="w-5 h-5 mr-2 text-gray-400" />
                        To Do
                      </h3>
                      <div className="space-y-3">
                        {activeSprint.tasks
                          .filter((t: Task) => t.status === "To Do")
                          .map((task: Task) => (
                            <div
                              key={task._id}
                              className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-white">
                                  {task.title}
                                </h4>
                                <button
                                  onClick={() =>
                                    updateTaskStatus(task._id, "In Progress")
                                  }
                                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                >
                                  Start
                                </button>
                              </div>
                              <p className="text-gray-400 text-sm mb-3 flex-grow">
                                {task.description}
                              </p>
                              <button
                                onClick={() => deleteTaskFromSprint(task._id)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* In Progress Column */}
                    <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Loader2 className="w-5 h-5 mr-2 text-yellow-500" />
                        In Progress
                      </h3>
                      <div className="space-y-3">
                        {activeSprint.tasks
                          .filter((t: Task) => t.status === "In Progress")
                          .map((task: Task) => (
                            <div
                              key={task._id}
                              className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-white">
                                  {task.title}
                                </h4>
                                <button
                                  onClick={() =>
                                    updateTaskStatus(task._id, "Done")
                                  }
                                  className="text-green-400 hover:text-green-300 transition-colors"
                                >
                                  Complete
                                </button>
                              </div>
                              <p className="text-gray-400 text-sm mb-3 flex-grow">
                                {task.description}
                              </p>
                              <button
                                onClick={() => deleteTaskFromSprint(task._id)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Done Column */}
                    <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <CheckSquare className="w-5 h-5 mr-2 text-green-500" />
                        Done
                      </h3>
                      <div className="space-y-3">
                        {activeSprint.tasks
                          .filter((t: Task) => t.status === "Done")
                          .map((task: Task) => (
                            <div
                              key={task._id}
                              className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col"
                            >
                              <h4 className="font-medium text-white mb-2">
                                {task.title}
                              </h4>
                              <p className="text-gray-400 text-sm mb-3 flex-grow">
                                {task.description}
                              </p>
                              <button
                                onClick={() => deleteTaskFromSprint(task._id)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sprint Review Section */}
            {activeSprint && (
              <div className="mb-8">
                <div
                  className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
                  onClick={() => setShowSprintReview(!showSprintReview)}
                >
                  <div className="flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-red-500" />
                    <h2 className="text-2xl font-semibold">Sprint Review</h2>
                  </div>
                  {showSprintReview ? <ChevronUp /> : <ChevronDown />}
                </div>

                {showSprintReview && (
                  <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
                    <div className="flex gap-4 mb-6">
                      <input
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Add review note"
                        className="flex-1 bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                      />
                      <button
                        onClick={addReviewNote}
                        className="bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-red-500/20 active:scale-[0.98] flex items-center"
                      >
                        <Plus className="w-5 h-5 mr-2" /> Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {activeSprint.reviewNotes?.map(
                        (note: string, index: number) => (
                          <div
                            key={index}
                            className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex justify-between items-start"
                          >
                            <p className="text-gray-300">{note}</p>
                            <button
                              onClick={() => deleteReviewNote(index)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      ) || (
                        <p className="text-gray-500">No review notes yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sprint Retrospective Section */}
            {activeSprint && (
              <div className="mb-8">
                <div
                  className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
                  onClick={() =>
                    setShowSprintRetrospective(!showSprintRetrospective)
                  }
                >
                  <div className="flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-red-500" />
                    <h2 className="text-2xl font-semibold">
                      Sprint Retrospective
                    </h2>
                  </div>
                  {showSprintRetrospective ? <ChevronUp /> : <ChevronDown />}
                </div>

                {showSprintRetrospective && (
                  <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
                    <div className="flex gap-4 mb-6">
                      <input
                        value={retrospectiveNote}
                        onChange={(e) => setRetrospectiveNote(e.target.value)}
                        placeholder="Add retrospective note"
                        className="flex-1 bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                      />
                      <button
                        onClick={addRetrospectiveNote}
                        className="bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-red-500/20 active:scale-[0.98] flex items-center"
                      >
                        <Plus className="w-5 h-5 mr-2" /> Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {activeSprint.retrospectiveNotes?.map(
                        (note: string, index: number) => (
                          <div
                            key={index}
                            className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex justify-between items-start"
                          >
                            <p className="text-gray-300">{note}</p>
                            <button
                              onClick={() => deleteRetrospectiveNote(index)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      ) || (
                        <p className="text-gray-500">
                          No retrospective notes yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Project Members Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Users className="w-6 h-6 mr-3 text-red-500" />
                Project Members
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {project &&
                  project.members.map(
                    (member: {
                      _id: string;
                      username: string;
                      email: string;
                    }) => (
                      <div
                        key={member._id}
                        className="bg-black/30 rounded-lg p-4 border border-gray-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {member.username}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
