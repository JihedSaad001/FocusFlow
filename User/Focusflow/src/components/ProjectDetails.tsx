"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Folder,
  Loader2,
  Users,
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
  PlayCircle,
  UserPlus,
  UserMinus,
  MessageSquare,
  CheckCircle,
  Bug,
  XCircle,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import Chat from "./Chat";
import type { Project, Task, Sprint, DecodedToken } from "../types";

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
  const [showBacklog, setShowBacklog] = useState(true);
  const [showSprintPlanning, setShowSprintPlanning] = useState(true);
  const [showSprintBoard, setShowSprintBoard] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const socket = useRef(
    io("https://focusflow-production.up.railway.app", { withCredentials: true })
  );
  const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] =
    useState<Task | null>(null);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] =
    useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        setCurrentUserId(decoded.id);
      } catch (error) {
        console.error("❌ Error decoding token:", error);
        navigate("/signin");
      }
    }
  }, [navigate]);

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

  useEffect(() => {
    if (!id) return;

    const fetchChatMessages = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          `https://focusflow-production.up.railway.app/api/projects/${id}/chat`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch chat messages");
        // We're not using the data, so we don't need to store it
        await response.json();
      } catch (error: any) {
        console.error("❌ Error fetching chat messages:", error);
        setError("Error fetching chat messages.");
      }
    };

    fetchChatMessages();

    socket.current.emit("joinRoom", id);

    return () => {
      socket.current.disconnect();
    };
  }, [id]);

  const addTaskToBacklog = async () => {
    if (!project) {
      setError("Project not loaded yet");
      return;
    }

    if (!newTask.title.trim()) {
      setNotification({
        message: "Task title is required",
        type: "error",
      });
      return;
    }

    const token = localStorage.getItem("token");
    try {
      // Simplify the request body to only include the required fields
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        deadline: newTask.deadline,
      };

      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/backlog`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add task to backlog");
      }
      const updatedProject = await response.json();
      setProject(updatedProject);
      setNewTask({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
        deadline: "",
      });

      // Show success notification
      setNotification({
        message: "Task added to backlog and poker planning session",
        type: "success",
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error adding task:", error);
      setNotification({
        message: "Error adding task to backlog",
        type: "error",
      });
    }
  };

  const deleteTaskFromBacklog = async (taskId: string) => {
    if (!project) {
      setError("Project not loaded yet");
      return;
    }

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
      setProject(updatedProject);

      setNotification({
        message: "Task deleted from backlog and poker planning",
        type: "success",
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error deleting task:", error);
      setNotification({
        message: "Error deleting task from backlog",
        type: "error",
      });
    }
  };

  const createSprint = async () => {
    if (!project) {
      setError("Project not loaded yet");
      return;
    }

    if (!newSprint.name.trim()) {
      setNotification({
        message: "Sprint name is required",
        type: "error",
      });
      return;
    }

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

      // Fetch the updated project to get the complete data structure
      const fetchProjectResponse = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!fetchProjectResponse.ok) {
        throw new Error("Failed to fetch updated project data");
      }

      const updatedProject = await fetchProjectResponse.json();
      setProject(updatedProject);

      // Find the newly created sprint (assuming it's the last one added)
      if (updatedProject.sprints && updatedProject.sprints.length > 0) {
        const newSprint =
          updatedProject.sprints[updatedProject.sprints.length - 1];
        setActiveSprint(newSprint);
      }

      // Reset the form
      setNewSprint({ name: "", startDate: "", endDate: "", goals: [""] });

      setNotification({
        message: "Sprint created successfully",
        type: "success",
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error creating sprint:", error);
      setNotification({
        message: `Error creating sprint: ${error.message}`,
        type: "error",
      });
    }
  };

  const deleteSprint = async (sprintId: string) => {
    if (!project) {
      setError("Project not loaded yet");
      return;
    }

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
      setProject(updatedProject);
      setActiveSprint(null);

      setNotification({
        message: "Sprint deleted successfully",
        type: "success",
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error deleting sprint:", error);
      setNotification({
        message: "Error deleting sprint",
        type: "error",
      });
    }
  };

  const deleteTaskFromSprint = async (taskId: string) => {
    if (!project || !activeSprint) {
      setError("Project or active sprint not loaded yet");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint._id}/tasks/${taskId}`,
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
      setProject(updatedProject);
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint._id
        ) || null
      );

      setNotification({
        message: "Task removed from sprint",
        type: "success",
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error deleting task:", error);
      setNotification({
        message: "Error removing task from sprint",
        type: "error",
      });
    }
  };

  // Modified updateTaskStatus function that uses a different approach
  const updateTaskStatus = async (
    taskId: string,
    status: "To Do" | "In Progress" | "Testing" | "Blocked" | "Done"
  ) => {
    if (!project || !activeSprint) {
      setError("Project or active sprint not loaded yet");
      return;
    }

    // Find the current task to get its assignedTo value
    const currentTask = activeSprint.tasks.find((task) => task._id === taskId);
    if (!currentTask) {
      setError("Task not found");
      return;
    }

    // Create a local copy of the project and update it
    const updatedProject = { ...project };
    const updatedSprint = updatedProject.sprints.find(
      (s) => s._id === activeSprint._id
    );

    if (updatedSprint) {
      const updatedTask = updatedSprint.tasks.find((t) => t._id === taskId);
      if (updatedTask) {
        updatedTask.status = status;
        // Keep the existing assignedTo value
      }
    }

    // Update the UI immediately with the local copy
    setProject(updatedProject);
    setActiveSprint(
      updatedProject.sprints.find((s) => s._id === activeSprint._id) || null
    );

    // Then send the update to the server
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint._id}/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            assignedTo: currentTask.assignedTo,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update task status");

      await response.json();

      setNotification({
        message: `Task moved to ${status}`,
        type: "success",
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error updating task status:", error);

      // If there's an error, fetch the project again to get the correct state
      try {
        const fetchResponse = await fetch(
          `https://focusflow-production.up.railway.app/api/projects/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (fetchResponse.ok) {
          const fetchedProject = await fetchResponse.json();
          setProject(fetchedProject);
          setActiveSprint(
            fetchedProject.sprints.find(
              (s: Sprint) => s._id === activeSprint._id
            ) || null
          );
        }
      } catch (fetchError) {
        console.error(
          "❌ Error fetching project after failed update:",
          fetchError
        );
      }

      setNotification({
        message: "Error updating task status",
        type: "error",
      });
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail) {
      setAddMemberError("Please enter an email address");
      return;
    }

    if (!project) {
      setAddMemberError("Project not loaded yet");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: memberEmail }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add member: ${errorText}`);
      }

      const fetchProjectResponse = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!fetchProjectResponse.ok) {
        const errorText = await fetchProjectResponse.text();
        throw new Error(`Failed to fetch updated project: ${errorText}`);
      }
      const updatedProject = await fetchProjectResponse.json();
      setProject(updatedProject);

      setAddMemberSuccess("Member added successfully!");
      setAddMemberError(null);
      setMemberEmail("");
      setShowAddMember(false);

      setTimeout(() => setAddMemberSuccess(null), 3000);
    } catch (error: any) {
      console.error("❌ Error adding member:", error);
      setAddMemberError(error.message);
      setAddMemberSuccess(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project) {
      setError("Project not loaded yet");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to remove this member from the project?"
      )
    )
      return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove member: ${errorText}`);
      }

      const fetchProjectResponse = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!fetchProjectResponse.ok) {
        const errorText = await fetchProjectResponse.text();
        throw new Error(`Failed to fetch updated project: ${errorText}`);
      }
      const updatedProject = await fetchProjectResponse.json();
      setProject(updatedProject);

      setAddMemberSuccess("Member removed successfully!");
      setAddMemberError(null);

      setTimeout(() => setAddMemberSuccess(null), 3000);
    } catch (error: any) {
      console.error("❌ Error removing member:", error);
      setAddMemberError(error.message);
      setAddMemberSuccess(null);
    }
  };

  const handlePokerSession = async () => {
    if (!project) {
      setError("Project not loaded yet");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("❌ No token found, redirecting to login.");
      navigate("/signin");
      return;
    }

    if (!project.activePokerSession) {
      try {
        const response = await fetch(
          `https://focusflow-production.up.railway.app/api/projects/${id}/poker/start`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to start poker session");
        const updatedProject = await response.json();
        setProject(updatedProject);
      } catch (error: any) {
        console.error("❌ Error starting poker session:", error);
        setError("Error starting poker session.");
        return;
      }
    }
    navigate(`/projects/${id}/poker`);
  };

  // Function to handle assigning a task to a user's personal kanban board
  const handleAssignToKanban = async (taskId: string, memberId: string) => {
    if (!project || !activeSprint) {
      setError("Project or active sprint not loaded yet");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      // First update the task assignment in the sprint
      const updateResponse = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/sprints/${activeSprint._id}/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assignedTo: memberId }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to assign task to member: ${errorText}`);
      }

      const updatedProject = await updateResponse.json();
      setProject(updatedProject);
      setActiveSprint(
        updatedProject.sprints.find(
          (s: Sprint) => s._id === activeSprint._id
        ) || null
      );

      // Then add the task to the user's kanban board
      // This would typically be done by the assigned user, but for demo purposes we'll do it here
      if (memberId === currentUserId) {
        console.log("Adding task to kanban board:", {
          projectId: id,
          sprintId: activeSprint._id,
          taskId,
        });

        const kanbanResponse = await fetch(
          `https://focusflow-production.up.railway.app/api/user/kanban/project-task`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectId: id,
              sprintId: activeSprint._id,
              taskId: taskId,
            }),
          }
        );

        if (!kanbanResponse.ok) {
          const errorText = await kanbanResponse.text();
          console.warn("Failed to add task to user's kanban board:", errorText);
        } else {
          console.log("Task added to kanban board successfully");
        }
      }

      setNotification({
        message: `Task assigned to ${
          project.members.find((m) => m._id === memberId)?.username
        }`,
        type: "success",
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);

      setAssignTaskModalOpen(false);
      setSelectedTaskForAssignment(null);
      setSelectedMemberForAssignment("");
    } catch (error: any) {
      console.error("❌ Error assigning task:", error);
      setNotification({
        message: "Error assigning task: " + error.message,
        type: "error",
      });
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

  const isProjectOwner = currentUserId && project?.owner._id === currentUserId;

  // Find member by ID
  const getMemberName = (memberId: string | undefined) => {
    if (!memberId) return "Unassigned";
    const member = project?.members.find((m) => m._id === memberId);
    return member ? member.username : "Unknown";
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      {/* Assign Task Modal */}
      {assignTaskModalOpen && selectedTaskForAssignment && (
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
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
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
                  {project?.activePokerSession
                    ? "Go to Poker Session"
                    : "Start Poker Session"}
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
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Items added to the backlog are automatically available in
                      poker planning for estimation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                      placeholder="Task Description"
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
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) =>
                        setNewTask({ ...newTask, deadline: e.target.value })
                      }
                      placeholder="Due Date"
                      className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                    />
                    <button
                      onClick={addTaskToBacklog}
                      className="md:col-span-2 bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-800"
                    >
                      <Plus className="w-5 h-5" />
                      Add Task
                    </button>
                  </div>

                  {project?.backlog.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-black/30 rounded-full mx-auto flex items-center justify-center mb-4">
                        <ListTodo className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-gray-400 text-lg">
                        No tasks in the backlog yet.
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Add your first task to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <div className="bg-black/30 rounded-t-lg p-3 grid grid-cols-12 gap-4 text-gray-400 text-sm font-medium">
                        <div className="col-span-5">Task</div>
                        <div className="col-span-3">Priority</div>
                        <div className="col-span-2">Estimate</div>
                        <div className="col-span-2">Actions</div>
                      </div>
                      <div className="space-y-1 mt-1">
                        {project?.backlog.map((task: Task) => (
                          <div
                            key={`backlog-${task._id}`}
                            className="bg-black/20 hover:bg-black/30 p-3 rounded-lg grid grid-cols-12 gap-4 items-center transition-colors"
                          >
                            <div className="col-span-5">
                              <h3 className="font-medium text-white truncate">
                                {task.title}
                              </h3>
                              <p className="text-gray-400 text-sm truncate">
                                {task.description}
                              </p>
                              {task.deadline && (
                                <div className="flex items-center text-gray-500 text-xs mt-1">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(task.deadline).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="col-span-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                            <div className="col-span-2">
                              {task.finalEstimate ? (
                                <span className="text-red-400 font-semibold">
                                  {task.finalEstimate}
                                </span>
                              ) : (
                                <span className="text-gray-500 text-sm">
                                  Not estimated
                                </span>
                              )}
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                              <button
                                onClick={() => deleteTaskFromBacklog(task._id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {/* Display existing sprints */}
                  {project?.sprints && project.sprints.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold text-white mb-4">
                        Existing Sprints
                      </h3>
                      <div className="space-y-4">
                        {project.sprints.map((sprint) => (
                          <div
                            key={sprint._id}
                            className="bg-black/20 rounded-lg p-6"
                          >
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
                                {new Date(
                                  sprint.startDate || ""
                                ).toLocaleDateString()}
                              </div>
                              <ArrowRight className="w-4 h-4" />
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(
                                  sprint.endDate || ""
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="space-y-2">
                              {sprint.goals.map(
                                (goal: string, index: number) => (
                                  <div
                                    key={`${sprint._id}-goal-${index}`}
                                    className="flex items-center gap-2 text-gray-300"
                                  >
                                    <Target className="w-4 h-4 text-red-500" />
                                    <span>{goal || "No goal"}</span>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Show Sprint Board directly under the selected sprint */}
                            {activeSprint &&
                              activeSprint._id === sprint._id && (
                                <div className="mt-6">
                                  <div
                                    className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
                                    onClick={() =>
                                      setShowSprintBoard(!showSprintBoard)
                                    }
                                  >
                                    <div className="flex items-center">
                                      <ClipboardList className="w-6 h-6 mr-3 text-red-500" />
                                      <h2 className="text-2xl font-semibold">
                                        Sprint Board
                                      </h2>
                                    </div>
                                    {showSprintBoard ? (
                                      <ChevronUp />
                                    ) : (
                                      <ChevronDown />
                                    )}
                                  </div>

                                  {showSprintBoard && (
                                    <div className="overflow-x-auto">
                                      <div className="grid grid-flow-col auto-cols-[minmax(300px,1fr)] gap-6 pb-4">
                                        {/* To Do Column */}
                                        <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
                                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                            <ListTodo className="w-5 h-5 mr-2 text-gray-400" />
                                            To Do
                                          </h3>
                                          <div className="space-y-3">
                                            {activeSprint.tasks
                                              .filter(
                                                (t: Task) =>
                                                  t.status === "To Do"
                                              )
                                              .map((task: Task) => (
                                                <div
                                                  key={`todo-${task._id}`}
                                                  className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col"
                                                >
                                                  <div className="flex justify-between items-start mb-2 gap-2">
                                                    <h4
                                                      className="font-medium text-white truncate flex-1"
                                                      title={task.title} // Tooltip to show full title on hover
                                                    >
                                                      {task.title}
                                                    </h4>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "In Progress"
                                                          )
                                                        }
                                                        className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
                                                      >
                                                        Start
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "Blocked"
                                                          )
                                                        }
                                                        className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                                      >
                                                        Block
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                                                    {task.description}
                                                  </p>
                                                  {task.finalEstimate && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <span className="text-red-400 font-semibold">
                                                        Estimate:{" "}
                                                        {task.finalEstimate}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {task.assignedTo && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <UserCircle className="w-4 h-4 mr-1" />
                                                      Assigned to:{" "}
                                                      {getMemberName(
                                                        task.assignedTo
                                                      )}
                                                    </div>
                                                  )}
                                                  <button
                                                    onClick={() =>
                                                      deleteTaskFromSprint(
                                                        task._id
                                                      )
                                                    }
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
                                                  >
                                                    <Trash2 className="w-4 h-4" />{" "}
                                                    Delete
                                                  </button>
                                                </div>
                                              ))}
                                          </div>
                                        </div>

                                        {/* In Progress Column */}
                                        <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
                                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                            <Loader2 className="w-5 h-5 mr-2 text-yellow-500" />
                                            In Progress
                                          </h3>
                                          <div className="space-y-3">
                                            {activeSprint.tasks
                                              .filter(
                                                (t: Task) =>
                                                  t.status === "In Progress"
                                              )
                                              .map((task: Task) => (
                                                <div
                                                  key={`inprogress-${task._id}`}
                                                  className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col"
                                                >
                                                  <div className="flex justify-between items-start mb-2 gap-2">
                                                    <h4
                                                      className="font-medium text-white truncate flex-1"
                                                      title={task.title}
                                                    >
                                                      {task.title}
                                                    </h4>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "Testing"
                                                          )
                                                        }
                                                        className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                                                      >
                                                        Test
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "Blocked"
                                                          )
                                                        }
                                                        className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                                      >
                                                        Block
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "To Do"
                                                          )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                                      >
                                                        Move Back
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                                                    {task.description}
                                                  </p>
                                                  {task.finalEstimate && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <span className="text-red-400 font-semibold">
                                                        Estimate:{" "}
                                                        {task.finalEstimate}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {task.assignedTo && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <UserCircle className="w-4 h-4 mr-1" />
                                                      Assigned to:{" "}
                                                      {getMemberName(
                                                        task.assignedTo
                                                      )}
                                                    </div>
                                                  )}
                                                  <button
                                                    onClick={() =>
                                                      deleteTaskFromSprint(
                                                        task._id
                                                      )
                                                    }
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
                                                  >
                                                    <Trash2 className="w-4 h-4" />{" "}
                                                    Delete
                                                  </button>
                                                </div>
                                              ))}
                                          </div>
                                        </div>

                                        {/* Testing Column */}
                                        <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
                                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                            <Bug className="w-5 h-5 mr-2 text-purple-500" />
                                            Testing
                                          </h3>
                                          <div className="space-y-3">
                                            {activeSprint.tasks
                                              .filter(
                                                (t: Task) =>
                                                  t.status === "Testing"
                                              )
                                              .map((task: Task) => (
                                                <div
                                                  key={`testing-${task._id}`}
                                                  className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col"
                                                >
                                                  <div className="flex justify-between items-start mb-2 gap-2">
                                                    <h4
                                                      className="font-medium text-white truncate flex-1"
                                                      title={task.title}
                                                    >
                                                      {task.title}
                                                    </h4>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "Done"
                                                          )
                                                        }
                                                        className="text-green-400 hover:text-green-300 transition-colors text-sm"
                                                      >
                                                        Complete
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "Blocked"
                                                          )
                                                        }
                                                        className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                                      >
                                                        Block
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "In Progress"
                                                          )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                                      >
                                                        Move Back
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                                                    {task.description}
                                                  </p>
                                                  {task.finalEstimate && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <span className="text-red-400 font-semibold">
                                                        Estimate:{" "}
                                                        {task.finalEstimate}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {task.assignedTo && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <UserCircle className="w-4 h-4 mr-1" />
                                                      Assigned to:{" "}
                                                      {getMemberName(
                                                        task.assignedTo
                                                      )}
                                                    </div>
                                                  )}
                                                  <button
                                                    onClick={() =>
                                                      deleteTaskFromSprint(
                                                        task._id
                                                      )
                                                    }
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
                                                  >
                                                    <Trash2 className="w-4 h-4" />{" "}
                                                    Delete
                                                  </button>
                                                </div>
                                              ))}
                                          </div>
                                        </div>

                                        {/* Blocked Column */}
                                        <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
                                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                            <XCircle className="w-5 h-5 mr-2 text-red-500" />
                                            Blocked
                                          </h3>
                                          <div className="space-y-3">
                                            {activeSprint.tasks
                                              .filter(
                                                (t: Task) =>
                                                  t.status === "Blocked"
                                              )
                                              .map((task: Task) => (
                                                <div
                                                  key={`blocked-${task._id}`}
                                                  className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col"
                                                >
                                                  <div className="flex justify-between items-start mb-2 gap-2">
                                                    <h4
                                                      className="font-medium text-white truncate flex-1"
                                                      title={task.title}
                                                    >
                                                      {task.title}
                                                    </h4>
                                                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "To Do"
                                                          )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                                      >
                                                        To Do
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "In Progress"
                                                          )
                                                        }
                                                        className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
                                                      >
                                                        In Progress
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                                                    {task.description}
                                                  </p>
                                                  {task.finalEstimate && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <span className="text-red-400 font-semibold">
                                                        Estimate:{" "}
                                                        {task.finalEstimate}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {task.assignedTo && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <UserCircle className="w-4 h-4 mr-1" />
                                                      Assigned to:{" "}
                                                      {getMemberName(
                                                        task.assignedTo
                                                      )}
                                                    </div>
                                                  )}
                                                  <button
                                                    onClick={() =>
                                                      deleteTaskFromSprint(
                                                        task._id
                                                      )
                                                    }
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
                                                  >
                                                    <Trash2 className="w-4 h-4" />{" "}
                                                    Delete
                                                  </button>
                                                </div>
                                              ))}
                                          </div>
                                        </div>

                                        {/* Done Column */}
                                        <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50 min-w-[300px]">
                                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                            <CheckSquare className="w-5 h-5 mr-2 text-green-500" />
                                            Done
                                          </h3>
                                          <div className="space-y-3">
                                            {activeSprint.tasks
                                              .filter(
                                                (t: Task) => t.status === "Done"
                                              )
                                              .map((task: Task) => (
                                                <div
                                                  key={`done-${task._id}`}
                                                  className="bg-black/30 rounded-lg p-4 border border-gray-700/50 flex flex-col"
                                                >
                                                  <div className="flex justify-between items-start mb-2 gap-2">
                                                    <h4
                                                      className="font-medium text-white truncate flex-1"
                                                      title={task.title}
                                                    >
                                                      {task.title}
                                                    </h4>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                      <button
                                                        onClick={() =>
                                                          updateTaskStatus(
                                                            task._id,
                                                            "Testing"
                                                          )
                                                        }
                                                        className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                                                      >
                                                        Move to Testing
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                                                    {task.description}
                                                  </p>
                                                  {task.finalEstimate && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <span className="text-red-400 font-semibold">
                                                        Estimate:{" "}
                                                        {task.finalEstimate}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {task.assignedTo && (
                                                    <div className="flex items-center text-gray-500 text-sm mb-3">
                                                      <UserCircle className="w-4 h-4 mr-1" />
                                                      Assigned to:{" "}
                                                      {getMemberName(
                                                        task.assignedTo
                                                      )}
                                                    </div>
                                                  )}
                                                  <button
                                                    onClick={() =>
                                                      deleteTaskFromSprint(
                                                        task._id
                                                      )
                                                    }
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors duration-200 mt-auto flex items-center justify-center gap-2"
                                                  >
                                                    <Trash2 className="w-4 h-4" />{" "}
                                                    Delete
                                                  </button>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Section */}
            <div className="mb-8">
              <div
                className="flex items-center justify-between cursor-pointer p-4 bg-black/30 rounded-lg mb-4 hover:bg-black/40 transition-colors duration-200"
                onClick={() => setShowChat(!showChat)}
              >
                <div className="flex items-center">
                  <MessageSquare className="w-6 h-6 mr-3 text-red-500" />
                  <h2 className="text-2xl font-semibold">Project Chat</h2>
                </div>
                {showChat ? <ChevronUp /> : <ChevronDown />}
              </div>

              {showChat && (
                <div className="bg-[#1E1E1E] rounded-lg p-6 border border-gray-700/50">
                  {id && <Chat projectId={id} />}
                </div>
              )}
            </div>

            {/* Project Members Section */}
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
                    (member: {
                      _id: string;
                      username: string;
                      email: string;
                    }) => (
                      <div
                        key={member._id}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
