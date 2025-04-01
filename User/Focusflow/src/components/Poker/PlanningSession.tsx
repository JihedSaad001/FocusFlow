"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "./Card";
import { IssueForm } from "./IssueForm";
import { IssueList } from "./IssueList";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import {
  Users,
  Eye,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Check,
  X,
} from "lucide-react";
import type { Issue, Vote } from "../../types"; // Ensure this matches the shared type definition

const CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "?"];

interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

interface VotingUser {
  userId: string;
  username: string;
}

interface Project {
  owner: { _id: string };
  members: { _id: string; username: string }[];
  sprints: Sprint[];
}

interface Sprint {
  _id: string;
  name: string;
  active: boolean;
}

export function PlanningSession() {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votesRevealed, setVotesRevealed] = useState(false);
  const [voteStats, setVoteStats] = useState({
    average: 0,
    mostCommon: 0,
    range: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  });
  const [votingUsers, setVotingUsers] = useState<VotingUser[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<any>(null);

  // New state for validation popup
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const getUserId = (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      setCurrentUserId(decoded.id);
      return decoded.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Initialize socket connection once
  useEffect(() => {
    if (!id) return;

    // Get user ID from token
    getUserId();

    // Create socket connection if it doesn't exist
    if (!socketRef.current) {
      console.log("Creating new Socket.IO connection");
      socketRef.current = io("http://localhost:5000", {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
      });
    }

    // Set up connection event handlers
    socketRef.current.on("connect", () => {
      console.log("Socket.IO connected:", socketRef.current.id);
      setSocketConnected(true);

      // Join the room for this project
      socketRef.current.emit("joinRoom", id);
      console.log(`Emitted joinRoom event for project ${id}`);
    });

    socketRef.current.on("connect_error", (err: any) => {
      console.error("Socket.IO connection error:", err.message);
      setSocketConnected(false);
      setError(
        `Real-time connection error: ${err.message}. Updates may be delayed.`
      );
    });

    socketRef.current.on("disconnect", (reason: string) => {
      console.log("Socket.IO disconnected:", reason);
      setSocketConnected(false);

      // Attempt to reconnect if disconnected
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, reconnect manually
        socketRef.current.connect();
      }
    });

    socketRef.current.on("reconnect", (attemptNumber: number) => {
      console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
      setSocketConnected(true);

      // Re-join the room after reconnection
      socketRef.current.emit("joinRoom", id);
    });

    // Clean up function
    return () => {
      console.log("Cleaning up Socket.IO connection");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!socketRef.current || !id) return;

    // Remove any existing listeners to prevent duplicates
    socketRef.current.off("voteUpdate");
    socketRef.current.off("votesRevealed");
    socketRef.current.off("issueAdded");
    socketRef.current.off("issueDeleted");
    socketRef.current.off("votesReset");

    // Listen for vote updates
    socketRef.current.on(
      "voteUpdate",
      ({
        issueId,
        vote,
        userId,
        username,
      }: {
        issueId: string;
        vote: string;
        userId: string;
        username: string;
      }) => {
        console.log("Received voteUpdate event:", {
          issueId,
          vote,
          userId,
          username,
        });

        setIssues((prevIssues) => {
          return prevIssues.map((issue) => {
            if (issue._id === issueId) {
              // Find if this user already has a vote
              const existingVoteIndex = issue.votes?.findIndex((v) => {
                const user = v.user;
                return typeof user === "string"
                  ? user === userId
                  : user._id === userId;
              });

              let updatedVotes;
              if (
                existingVoteIndex !== -1 &&
                existingVoteIndex !== undefined &&
                issue.votes
              ) {
                // Update existing vote
                updatedVotes = [...issue.votes];
                updatedVotes[existingVoteIndex] = {
                  ...updatedVotes[existingVoteIndex],
                  vote,
                };
              } else {
                // Add new vote
                updatedVotes = [
                  ...(issue.votes || []),
                  { user: { _id: userId, username }, vote },
                ];
              }

              return { ...issue, votes: updatedVotes };
            }
            return issue;
          });
        });
      }
    );

    // Listen for votes revealed
    socketRef.current.on(
      "votesRevealed",
      ({
        issueId,
        votes,
        status,
      }: {
        issueId: string;
        votes: Vote[];
        status: string;
      }) => {
        console.log("Received votesRevealed event:", {
          issueId,
          votes,
          status,
        });

        setIssues((prevIssues) =>
          prevIssues.map((issue) =>
            issue._id === issueId
              ? { ...issue, votes, status: status as Issue["status"] }
              : issue
          )
        );

        if (currentIssue && currentIssue._id === issueId) {
          setVotesRevealed(true);
          updateVoteStats(votes);
          setVotingUsers(
            votes.map((vote) => ({
              userId: typeof vote.user === "string" ? vote.user : vote.user._id,
              username:
                typeof vote.user === "string" ? "Unknown" : vote.user.username,
            }))
          );
          setCurrentIssue((prev) =>
            prev ? { ...prev, votes, status: status as Issue["status"] } : prev
          );
        }
      }
    );

    // Listen for new issues
    socketRef.current.on("issueAdded", ({ issue }: { issue: Issue }) => {
      console.log("Received issueAdded event:", issue);
      setIssues((prevIssues) => {
        // Check if the issue already exists to prevent duplicates
        const exists = prevIssues.some((i) => i._id === issue._id);
        if (exists) {
          return prevIssues;
        }
        return [...prevIssues, issue];
      });
    });

    // Listen for deleted issues
    socketRef.current.on("issueDeleted", ({ issueId }: { issueId: string }) => {
      console.log("Received issueDeleted event:", issueId);
      setIssues((prevIssues) =>
        prevIssues.filter((issue) => issue._id !== issueId)
      );

      if (currentIssue && currentIssue._id === issueId) {
        setCurrentIssue(null);
        setVotesRevealed(false);
        setVoteStats({
          average: 0,
          mostCommon: 0,
          range: {
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY,
          },
        });
        setVotingUsers([]);
      }
    });

    // Listen for vote resets
    socketRef.current.on("votesReset", ({ issueId }: { issueId: string }) => {
      console.log("Received votesReset event:", issueId);
      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue._id === issueId
            ? { ...issue, votes: [], status: "Not Started" }
            : issue
        )
      );

      if (currentIssue && currentIssue._id === issueId) {
        setVotesRevealed(false);
        setVoteStats({
          average: 0,
          mostCommon: 0,
          range: {
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY,
          },
        });
        setVotingUsers([]);
        setCurrentIssue((prev) =>
          prev ? { ...prev, votes: [], status: "Not Started" } : prev
        );
      }
    });

    // Debug event to confirm room joining
    socketRef.current.on(
      "roomJoined",
      ({ projectId }: { projectId: string }) => {
        console.log(`Successfully joined room for project ${projectId}`);
      }
    );
  }, [id, currentIssue]);

  // Fetch poker session data
  useEffect(() => {
    if (!id || id.trim() === "") {
      console.error(
        "Project ID is missing or empty. Cannot fetch poker session."
      );
      setError(
        "Project ID is missing or empty. Please navigate to a valid project."
      );
      return;
    }
    fetchPokerSession();
    fetchProject();
  }, [id]);

  // Update current issue when issues change
  useEffect(() => {
    if (currentIssue) {
      const updatedIssue = issues.find((i) => i._id === currentIssue._id);
      if (updatedIssue) {
        setCurrentIssue(updatedIssue);
        setVotingUsers(
          (updatedIssue.votes || []).map((vote) => ({
            userId: typeof vote.user === "string" ? vote.user : vote.user._id,
            username:
              typeof vote.user === "string" ? "Unknown" : vote.user.username,
          }))
        );
        if (votesRevealed) {
          updateVoteStats(updatedIssue.votes || []);
        }
      }
    } else {
      setVotingUsers([]);
    }
  }, [issues, currentIssue, votesRevealed]);

  const fetchPokerSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("❌ No token found, redirecting to login.");
      navigate("/signin");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${id}/poker`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        setError(
          `Error fetching poker session: ${response.status} - ${errorText}`
        );
        return;
      }
      const data = await response.json();
      console.log("Fetched poker session data:", data);

      // Ensure each issue has a valid status
      const issuesWithStatus = (data.issues || []).map((issue: Issue) => ({
        ...issue,
        status: issue.status || "Not Started",
      }));

      setIssues(issuesWithStatus);
    } catch (error: any) {
      setError(`Error fetching poker session: ${error.message}`);
    }
  };

  const fetchProject = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("❌ No token found, redirecting to login.");
      navigate("/signin");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      setProject(data);

      // Set default selected sprint if there's an active one
      const activeSprint = data.sprints?.find((s: Sprint) => s.active);
      if (activeSprint) {
        setSelectedSprintId(activeSprint._id);
      } else if (data.sprints?.length > 0) {
        setSelectedSprintId(data.sprints[0]._id);
      }

      // Set default selected member if current user is a member
      if (data.members?.length > 0) {
        setSelectedMemberId(data.members[0]._id);
      }
    } catch (error: any) {
      console.error("❌ Error fetching project:", error);
      setError(error.message);
    }
  };

  const handleVote = async (value: string) => {
    if (votesRevealed || (currentIssue && currentIssue.status === "Revealed")) {
      // Just return early instead of showing an error
      return;
    }

    console.log("Vote cast:", value);
    setSelectedCard(value);
    if (currentIssue) {
      const userId = getUserId();
      if (!userId) {
        setError("User ID not found. Please log in again.");
        navigate("/signin");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/projects/${id}/poker/issue/${currentIssue._id}/vote`,
          {
            method: "POST",
            body: JSON.stringify({ vote: value }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to record vote:", errorText);
          setError(`Failed to record vote: ${errorText}`);
          return;
        }

        // The server will emit the voteUpdate event to all clients
        console.log("Vote recorded successfully");
      } catch (error: any) {
        console.error("Error recording vote:", error);
        setError(`Error recording vote: ${error.message}`);
      }
    }
  };

  const handleRevealVotes = async () => {
    if (currentIssue) {
      setIsUpdating(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/projects/${id}/poker/issue/${currentIssue._id}/reveal`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to reveal votes: ${errorText}`);
        }

        // The server will emit the votesRevealed event to all clients
        console.log("Votes revealed successfully");

        // Update the local state as well to ensure UI consistency
        setCurrentIssue((prev) =>
          prev ? { ...prev, status: "Revealed" } : null
        );
        setVotesRevealed(true);
      } catch (error: any) {
        setError(`Error revealing votes: ${error.message}`);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleRevote = async () => {
    if (currentIssue) {
      setIsUpdating(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/projects/${id}/poker/issue/${currentIssue._id}/revote`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to reset votes: ${errorText}`);
        }

        // The server will emit the votesReset event to all clients
        console.log("Votes reset successfully");
      } catch (error: any) {
        setError(`Error resetting votes: ${error.message}`);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleValidate = () => {
    if (!currentIssue || !votesRevealed) {
      setError("Please reveal votes before validating the session.");
      return;
    }

    // Only project owner can validate
    if (!isProjectOwner) {
      setError("Only the project owner can validate issues.");
      return;
    }

    // Show validation popup instead of immediately validating
    setShowValidationPopup(true);
  };

  const submitValidation = async () => {
    if (!currentIssue) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${id}/poker/issue/${currentIssue._id}/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            finalEstimate: voteStats.mostCommon.toString(),
            sprintId: selectedSprintId,
            assignedTo: selectedMemberId,
          }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to validate session: ${errorText}`);
      }

      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue._id === currentIssue._id
            ? {
                ...issue,
                status: "Finished",
                finalEstimate: voteStats.mostCommon.toString(),
              }
            : issue
        )
      );

      setCurrentIssue((prev) =>
        prev
          ? {
              ...prev,
              status: "Finished",
              finalEstimate: voteStats.mostCommon.toString(),
            }
          : prev
      );

      setVotesRevealed(false);
      setVoteStats({
        average: 0,
        mostCommon: 0,
        range: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
      });
      setVotingUsers([]);
      setShowValidationPopup(false);

      // If the task is assigned to the current user, add it to their Kanban board
      if (selectedMemberId === currentUserId) {
        try {
          const kanbanResponse = await fetch(
            `http://localhost:5000/api/user/kanban/project-task`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                projectId: id,
                sprintId: selectedSprintId,
                taskId: currentIssue._id,
              }),
            }
          );

          if (!kanbanResponse.ok) {
            console.warn("Failed to add task to user's kanban board");
          } else {
            console.log("Task added to user's kanban board successfully");
          }
        } catch (error) {
          console.error("Error adding task to kanban board:", error);
        }
      }
    } catch (error: any) {
      setError(`Error validating session: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateVoteStats = (votes: Vote[] = []) => {
    const allVotes = votes
      .map((v) => (v.vote ? Number.parseInt(v.vote, 10) : 0))
      .filter((v: number) => !isNaN(v) && v !== null);
    if (allVotes.length === 0) {
      setVoteStats({
        average: 0,
        mostCommon: 0,
        range: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
      });
      return;
    }
    const average = allVotes.reduce((a, b) => a + b, 0) / allVotes.length;
    const voteCounts: { [key: number]: number } = {};
    allVotes.forEach((v) => {
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    });

    let mostCommon = 0;
    let maxCount = 0;
    Object.entries(voteCounts).forEach(([vote, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = Number.parseInt(vote);
      }
    });

    const range = { min: Math.min(...allVotes), max: Math.max(...allVotes) };
    setVoteStats({ average, mostCommon, range });
  };

  const handleIssueSelect = (issue: Issue) => {
    setCurrentIssue(issue);
    setSelectedCard(null);
    setVotesRevealed(
      issue.status === "Revealed" || issue.status === "Finished"
    );
    updateVoteStats(issue.votes || []);
  };

  const handleIssueAdded = () => {
    setShowAddIssue(false);
    fetchPokerSession();
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/projects/${id}/poker`;
    navigator.clipboard.writeText(url);
  };

  if (!id || id.trim() === "") {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-lg w-full">
          <p className="text-red-400 text-center">
            Error: Project ID is missing or empty. Please navigate to a valid
            project.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-lg w-full">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  const isProjectOwner = currentUserId && project?.owner._id === currentUserId;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="border-b border-gray-700/50 p-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                  Poker Planning Session
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-400 flex items-center gap-2">
                    <Users size={20} />
                    {issues.length} issues
                  </p>
                  {socketConnected ? (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                      Real-time connected
                    </span>
                  ) : (
                    <span className="text-red-400 text-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-400 rounded-full inline-block"></span>
                      Disconnected
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={copyInviteLink}
                  className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg hover:bg-black/50 transition-colors text-gray-300 hover:text-white"
                >
                  <Copy size={20} />
                  Copy Invite Link
                </button>
                {isProjectOwner && (
                  <button
                    onClick={handleValidate}
                    disabled={isUpdating || !currentIssue || !votesRevealed}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    <Check size={20} />
                    Validate
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-3 gap-8">
            <div>
              <div className="bg-black/50 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Issues</h2>
                  <button
                    onClick={() => setShowAddIssue(!showAddIssue)}
                    className="p-2 rounded-lg bg-black/30 text-gray-300 hover:text-white hover:bg-black/50 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {id && showAddIssue && (
                  <div className="mb-6 p-4 bg-black/30 rounded-lg border border-gray-700">
                    <IssueForm sessionId={id} onIssueAdded={handleIssueAdded} />
                  </div>
                )}
                <IssueList
                  issues={issues.map((issue) => ({
                    ...issue,
                    votes: issue.votes?.map((vote) => ({
                      user:
                        typeof vote.user === "string"
                          ? vote.user
                          : vote.user._id,
                      vote: vote.vote,
                    })),
                  }))}
                  onIssueSelect={handleIssueSelect}
                  currentIssueId={currentIssue?._id}
                  onDeleteIssue={(issueId) => {
                    fetch(
                      `http://localhost:5000/api/projects/${id}/poker/issue/${issueId}`,
                      {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      }
                    ).then(() => fetchPokerSession());
                  }}
                />
              </div>
            </div>

            <div className="col-span-2">
              {currentIssue ? (
                <div className="space-y-8">
                  <div className="bg-black/50 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {currentIssue.title}
                    </h2>
                    {currentIssue.description && (
                      <p className="text-gray-400 mb-6">
                        {currentIssue.description}
                      </p>
                    )}
                    <div className="mb-6 p-3 bg-black/30 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400">
                          {votingUsers.length} user
                          {votingUsers.length !== 1 ? "s" : ""} have voted
                        </p>
                        {isProjectOwner && (
                          <div className="flex gap-2">
                            {!votesRevealed &&
                            currentIssue.status !== "Revealed" ? (
                              <button
                                onClick={handleRevealVotes}
                                disabled={isUpdating}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                              >
                                <Eye size={20} />
                                Reveal Votes
                              </button>
                            ) : (
                              <button
                                onClick={handleRevote}
                                disabled={isUpdating}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                              >
                                <Eye size={20} />
                                Revote
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {votingUsers.length > 0 ? (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {votingUsers.map((user) => (
                            <div
                              key={user.userId}
                              className="flex items-center gap-1 bg-gray-700/50 rounded-full px-3 py-1 text-sm text-gray-300"
                            >
                              <span>{user.username}</span>
                              <CheckCircle2
                                size={14}
                                className="text-green-500"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm mt-2">
                          No votes yet.
                        </p>
                      )}
                      {(votesRevealed ||
                        currentIssue.status === "Revealed") && (
                        <div className="mt-4">
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                              <span className="text-gray-400">Average</span>
                              <span className="text-red-400 font-semibold">
                                {voteStats.average.toFixed(1)}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-gray-400">Most Common</span>
                              <span className="text-red-400 font-semibold">
                                {voteStats.mostCommon}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-gray-400">Range</span>
                              <span className="text-red-400 font-semibold">
                                {voteStats.range.min ===
                                Number.POSITIVE_INFINITY
                                  ? "Infinity"
                                  : voteStats.range.min}{" "}
                                -{" "}
                                {voteStats.range.max ===
                                Number.NEGATIVE_INFINITY
                                  ? "-Infinity"
                                  : voteStats.range.max}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-gray-400 mb-2">Votes</h3>
                          <div className="flex gap-2 flex-wrap">
                            {votingUsers.map((user) => {
                              const userVote = currentIssue.votes?.find((v) => {
                                const voteUser = v.user;
                                return typeof voteUser === "string"
                                  ? voteUser === user.userId
                                  : voteUser._id === user.userId;
                              })?.vote;
                              return (
                                <div
                                  key={user.userId}
                                  className="flex items-center gap-1 bg-gray-700/50 rounded-full px-3 py-1 text-sm text-gray-300"
                                >
                                  <span>{user.username}:</span>
                                  <span className="text-red-400 font-semibold">
                                    {userVote || "N/A"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {voteStats.average === voteStats.mostCommon &&
                            voteStats.average !== 0 && (
                              <p className="text-green-500 mt-2 flex items-center gap-1">
                                <CheckCircle2 size={16} />
                                High Agreement
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {CARD_VALUES.map((value) => (
                        <Card
                          key={value}
                          value={value}
                          selected={selectedCard === value}
                          onClick={() => handleVote(value)}
                          disabled={
                            votesRevealed ||
                            (currentIssue && currentIssue.status === "Revealed")
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/50 rounded-xl border border-gray-700 p-12 text-center">
                  <div className="bg-black/30 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    No Issue Selected
                  </h2>
                  <p className="text-gray-400">
                    Select an issue from the list or create a new one to start
                    voting
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-xl border border-gray-700 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Validate Issue
              </h3>
              <button
                onClick={() => setShowValidationPopup(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-300 mb-4">
              Final estimate:{" "}
              <span className="text-red-400 font-semibold">
                {voteStats.mostCommon}
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">
                  Add to Sprint
                </label>
                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                >
                  {project?.sprints.map((sprint) => (
                    <option key={sprint._id} value={sprint._id}>
                      {sprint.name} {sprint.active ? "(Active)" : ""}
                    </option>
                  ))}
                  {(!project?.sprints || project.sprints.length === 0) && (
                    <option value="">No sprints available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Assign To</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                >
                  {project?.members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowValidationPopup(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitValidation}
                  disabled={isUpdating || !selectedSprintId}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Validating..." : "Validate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanningSession;
