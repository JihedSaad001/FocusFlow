import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { jwtDecode } from "jwt-decode";
import io from "socket.io-client";
import type { Project, Task, Sprint, DecodedToken } from "../../types";
import axios from "axios";

// Import all the components
import ProjectHeader from "./ProjectHeader";
import BacklogSection from "./BacklogSection";
import SprintSection from "./SprintSection";
import ChatSection from "./ChatSection";
import ProjectMembers from "./ProjectMembers";
import AssignTaskModal from "./AssignTaskModal";
import Notification from "./Notification";
import { ArrowLeft } from "lucide-react";

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
    io("https://focusflow-production.up.railway.app", {
      autoConnect: true,
    })
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
        // Create axios instance with default config
        const api = axios.create({
          baseURL: "https://focusflow-production.up.railway.app/api",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Get project by ID
        const response = await api.get(`/projects/${id}`);
        const data = response.data;

        setProject(data);
        const active = data.sprints?.find((s: Sprint) => s.active);
        setActiveSprint(active || null);
      } catch (error: any) {
        console.error("❌ Error fetching project:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch project"
        );
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

    // Validate deadline date if provided
    if (newTask.deadline) {
      const deadlineDate = new Date(newTask.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

      // Check if date is in the past
      if (deadlineDate < today) {
        setNotification({
          message: "Deadline cannot be in the past",
          type: "error",
        });
        return;
      }

      // Check if date is too far in the future (5 years)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 5);

      if (deadlineDate > maxDate) {
        setNotification({
          message: "Deadline is too far in the future (max 5 years)",
          type: "error",
        });
        return;
      }
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

    // Validate sprint dates
    if (!newSprint.startDate) {
      setNotification({
        message: "Sprint start date is required",
        type: "error",
      });
      return;
    }

    if (!newSprint.endDate) {
      setNotification({
        message: "Sprint end date is required",
        type: "error",
      });
      return;
    }

    const startDate = new Date(newSprint.startDate);
    const endDate = new Date(newSprint.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

    // Check if dates are valid
    if (startDate < today) {
      setNotification({
        message: "Sprint cannot start in the past",
        type: "error",
      });
      return;
    }

    if (endDate <= startDate) {
      setNotification({
        message: "End date must be after start date",
        type: "error",
      });
      return;
    }

    // Check if sprint duration is reasonable
    const maxDate = new Date(startDate);
    maxDate.setMonth(maxDate.getMonth() + 6); // Max 6 months sprint

    if (endDate > maxDate) {
      setNotification({
        message: "Sprint duration cannot exceed 6 months",
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

  const isProjectOwner = Boolean(
    currentUserId && project?.owner._id === currentUserId
  );

  // Find member by ID
  const getMemberName = (memberId: string | undefined) => {
    if (!memberId) return "Unassigned";
    const member = project?.members.find((m) => m._id === memberId);
    return member ? member.username : "Unknown";
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <Notification notification={notification} />

      {/* Assign Task Modal */}
      {assignTaskModalOpen && selectedTaskForAssignment && (
        <AssignTaskModal
          project={project}
          selectedTaskForAssignment={selectedTaskForAssignment}
          selectedMemberForAssignment={selectedMemberForAssignment}
          setSelectedMemberForAssignment={setSelectedMemberForAssignment}
          setAssignTaskModalOpen={setAssignTaskModalOpen}
          setSelectedTaskForAssignment={setSelectedTaskForAssignment}
          handleAssignToKanban={handleAssignToKanban}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Projects</span>
          </button>
        </div>
        <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <ProjectHeader
            project={project}
            showAddMember={showAddMember}
            setShowAddMember={setShowAddMember}
            handlePokerSession={handlePokerSession}
            memberEmail={memberEmail}
            setMemberEmail={setMemberEmail}
            handleAddMember={handleAddMember}
            addMemberError={addMemberError}
            addMemberSuccess={addMemberSuccess}
          />

          <div className="p-8">
            {/* Backlog Section */}
            <BacklogSection
              project={project}
              showBacklog={showBacklog}
              setShowBacklog={setShowBacklog}
              newTask={newTask}
              setNewTask={setNewTask}
              addTaskToBacklog={addTaskToBacklog}
              deleteTaskFromBacklog={deleteTaskFromBacklog}
            />

            {/* Sprint Planning Section */}
            <SprintSection
              project={project}
              showSprintPlanning={showSprintPlanning}
              setShowSprintPlanning={setShowSprintPlanning}
              showSprintBoard={showSprintBoard}
              setShowSprintBoard={setShowSprintBoard}
              newSprint={newSprint}
              setNewSprint={setNewSprint}
              createSprint={createSprint}
              deleteSprint={deleteSprint}
              activeSprint={activeSprint}
              setActiveSprint={setActiveSprint}
              updateTaskStatus={updateTaskStatus}
              deleteTaskFromSprint={deleteTaskFromSprint}
              getMemberName={getMemberName}
            />

            {/* Chat Section */}
            <ChatSection
              id={id}
              showChat={showChat}
              setShowChat={setShowChat}
            />

            {/* Project Members Section */}
            <ProjectMembers
              project={project}
              isProjectOwner={isProjectOwner}
              handleRemoveMember={handleRemoveMember}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
