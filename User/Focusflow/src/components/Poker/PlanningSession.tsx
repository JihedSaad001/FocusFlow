"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "./Card";
import { IssueForm } from "./IssueForm";
import { IssueList } from "./IssueList";
import io from "socket.io-client";
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
  Clock,
} from "lucide-react";
import type { Issue, Vote } from "../../types";

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

interface ValidationIssue {
  issue: Issue;
  selectedMemberId: string;
  deadline: Date; // Changed from delay (number) to deadline (Date)
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
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>(
    []
  );
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");

  const getUserId = (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      setCurrentUserId(decoded.id);

      // Make sure username is stored in localStorage
      if (!localStorage.getItem("username") && decoded.username) {
        localStorage.setItem("username", decoded.username);
        console.log(`Stored username in localStorage: ${decoded.username}`);
      }

      return decoded.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Initialize socket connection once
  useEffect(() => {
    if (!id) return;

    getUserId();

    if (!socketRef.current) {
      console.log("Creating new Socket.IO connection");
      const socketUrl = "https://focusflow-production.up.railway.app";
      const token = localStorage.getItem("token");

      // Get the username from localStorage to send with the connection
      const username = localStorage.getItem("username");
      console.log(`Connecting with username: ${username}`);

      socketRef.current = io(socketUrl, {
        autoConnect: true,
        transports: ["websocket", "polling"],
        auth: {
          token: token,
          username: username, // Send username with the connection
        },
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      });
    }

    socketRef.current.on("connect", () => {
      console.log("Socket.IO connected:", socketRef.current.id);
      setSocketConnected(true);
      socketRef.current.emit("joinRoom", id);
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
      if (reason === "io server disconnect") {
        socketRef.current.connect();
      }
    });

    socketRef.current.on("reconnect", (attemptNumber: number) => {
      console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
      setSocketConnected(true);
      socketRef.current.emit("joinRoom", id);
    });

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

    // Remove existing listeners to prevent duplicates
    socketRef.current.off("voteRecorded");
    socketRef.current.off("voteRevealed");
    socketRef.current.off("issueAdded");
    socketRef.current.off("issueDeleted");
    socketRef.current.off("voteReset");

    // Listen for voteRecorded event
    socketRef.current.on(
      "voteRecorded",
      ({
        issueId,
        votes,
        status,
      }: {
        issueId: string;
        votes: Vote[];
        status: string;
      }) => {
        console.log("Received vote update for issue:", issueId);

        // Process votes to ensure proper user objects
        const processedVotes = votes.map((vote) => {
          let user;
          if (typeof vote.user === "string") {
            // Try to find the user in the project members
            const userId = vote.user;
            const member = project?.members?.find((m) => m._id === userId);
            if (member) {
              user = { _id: userId, username: member.username };
            } else if (userId === currentUserId) {
              user = {
                _id: userId,
                username: localStorage.getItem("username") || "You",
              };
            } else {
              user = { _id: userId, username: "Unknown" };
            }
          } else {
            user = vote.user;
          }

          return {
            ...vote,
            user,
          };
        });

        // Update the issues state
        setIssues((prevIssues) => {
          return prevIssues.map((issue) => {
            if (issue._id === issueId) {
              return {
                ...issue,
                votes: processedVotes,
                status: status as Issue["status"],
              };
            }
            return issue;
          });
        });

        // Update current issue if it's the one that received votes
        if (currentIssue && currentIssue._id === issueId) {
          // Create a list of voting users from the processed votes
          const votingUsersList = processedVotes.map((vote) => {
            const userId =
              typeof vote.user === "string" ? vote.user : vote.user._id;
            let username;

            // If this is the current user, use the username from localStorage
            if (userId === currentUserId) {
              username = localStorage.getItem("username") || "You";
            } else {
              // For other users, use the username from the vote object
              username =
                typeof vote.user === "string" ? "Unknown" : vote.user.username;
            }

            return {
              userId,
              username,
            };
          });

          setVotingUsers(votingUsersList);

          setCurrentIssue((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              votes: processedVotes,
              status: status as Issue["status"],
            };
          });
        }
      }
    );

    // Listen for voteRevealed event
    socketRef.current.on(
      "voteRevealed",
      ({
        issueId,
        votes,
        status,
      }: {
        issueId: string;
        votes: Vote[];
        status: string;
      }) => {
        console.log("Votes revealed for issue:", issueId);

        // Process votes to ensure proper user objects
        const processedVotes = votes.map((vote) => {
          let user;
          if (typeof vote.user === "string") {
            const userId = vote.user;
            const member = project?.members?.find((m) => m._id === userId);
            if (member) {
              user = { _id: userId, username: member.username };
            } else if (userId === currentUserId) {
              user = {
                _id: userId,
                username: localStorage.getItem("username") || "You",
              };
            } else {
              user = { _id: userId, username: "Unknown" };
            }
          } else {
            user = vote.user;
          }

          return {
            ...vote,
            user,
          };
        });

        // Update the issues state
        setIssues((prevIssues) => {
          return prevIssues.map((issue) =>
            issue._id === issueId
              ? {
                  ...issue,
                  votes: processedVotes,
                  status: status as Issue["status"],
                }
              : issue
          );
        });

        if (currentIssue && currentIssue._id === issueId) {
          setVotesRevealed(true);
          updateVoteStats(processedVotes);

          // Create a list of voting users from the processed votes
          const votingUsersList = processedVotes.map((vote) => {
            const userId =
              typeof vote.user === "string" ? vote.user : vote.user._id;
            let username;

            // If this is the current user, use the username from localStorage
            if (userId === currentUserId) {
              username = localStorage.getItem("username") || "You";
            } else {
              // For other users, use the username from the vote object
              username =
                typeof vote.user === "string" ? "Unknown" : vote.user.username;
            }

            return {
              userId,
              username,
            };
          });

          setVotingUsers(votingUsersList);

          setCurrentIssue((prev) =>
            prev
              ? {
                  ...prev,
                  votes: processedVotes,
                  status: status as Issue["status"],
                }
              : prev
          );
        }
      }
    );

    socketRef.current.on("issueAdded", ({ issue }: { issue: Issue }) => {
      console.log("New issue added:", issue.title);
      setIssues((prevIssues) => {
        const exists = prevIssues.some((i) => i._id === issue._id);
        if (exists) return prevIssues;
        return [...prevIssues, issue];
      });
    });

    socketRef.current.on("issueDeleted", ({ issueId }: { issueId: string }) => {
      console.log("Issue deleted:", issueId);
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

    socketRef.current.on("voteReset", ({ issueId }: { issueId: string }) => {
      console.log("Votes reset for issue:", issueId);
      setIssues((prevIssues) => {
        return prevIssues.map((issue) =>
          issue._id === issueId
            ? { ...issue, votes: [], status: "Not Started" }
            : issue
        );
      });

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

    socketRef.current.on(
      "roomJoined",
      ({ projectId }: { projectId: string }) => {
        console.log(`Successfully joined room for project ${projectId}`);
      }
    );

    return () => {
      // Cleanup function
    };
  }, [id, currentIssue, currentUserId, project]);

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

    // No periodic refresh - rely on socket events for real-time updates
    return () => {
      // Cleanup function
    };
  }, [id]);

  // Update current issue when issues change
  useEffect(() => {
    if (currentIssue) {
      const updatedIssue = issues.find((i) => i._id === currentIssue._id);
      if (updatedIssue) {
        setCurrentIssue(updatedIssue);

        // Create the voting users list with special handling for the current user
        setVotingUsers(
          (updatedIssue.votes || []).map((vote) => {
            const userId =
              typeof vote.user === "string" ? vote.user : vote.user._id;
            let username;

            // If this is the current user, use the username from localStorage
            if (userId === currentUserId) {
              username = localStorage.getItem("username") || "You";
            } else {
              // For other users, use the username from the vote object
              username =
                typeof vote.user === "string" ? "Unknown" : vote.user.username;
            }

            return {
              userId,
              username,
            };
          })
        );

        if (votesRevealed) {
          updateVoteStats(updatedIssue.votes || []);
        }
      }
    } else {
      setVotingUsers([]);
    }
  }, [issues, currentIssue, votesRevealed, currentUserId]);

  const fetchPokerSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login.");
      navigate("/signin");
      return;
    }

    try {
      if (!id) {
        throw new Error("Project ID is missing");
      }

      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/poker`,
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

      const issuesWithStatus = (data.issues || []).map((issue: Issue) => ({
        ...issue,
        status: issue.status || "Not Started",
      }));

      setIssues(issuesWithStatus);

      // Initial setup of current issue if none is selected
      if (!currentIssue && issuesWithStatus.length > 0) {
        const firstIssue = issuesWithStatus[0];
        setCurrentIssue(firstIssue);
      }
    } catch (error: any) {
      setError(`Error fetching poker session: ${error.message}`);
    }
  };

  const fetchProject = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login.");
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

      const activeSprint = data.sprints?.find((s: Sprint) => s.active);
      if (activeSprint) {
        setSelectedSprintId(activeSprint._id);
      } else if (data.sprints?.length > 0) {
        setSelectedSprintId(data.sprints[0]._id);
      }
    } catch (error: any) {
      console.error("Error fetching project:", error);
      setError(error.message);
    }
  };

  const handleVote = async (value: string) => {
    if (votesRevealed || (currentIssue && currentIssue.status === "Revealed")) {
      return;
    }

    setSelectedCard(value);

    if (currentIssue && id) {
      const userId = getUserId();
      if (!userId) {
        setError("User ID not found. Please log in again.");
        navigate("/signin");
        return;
      }

      // Optimistically update the UI immediately for instant feedback
      const username = localStorage.getItem("username") || "You";

      // Find the current vote or add a new one
      const updatedVotes = [...(currentIssue.votes || [])];
      const existingVoteIndex = updatedVotes.findIndex((v) =>
        typeof v.user === "string" ? v.user === userId : v.user._id === userId
      );

      if (existingVoteIndex !== -1) {
        updatedVotes[existingVoteIndex].vote = value;

        // Make sure the username is set correctly
        if (typeof updatedVotes[existingVoteIndex].user === "object") {
          updatedVotes[existingVoteIndex].user.username = username;
        }
      } else {
        // Create a user object with both ID and username to match the populated format
        const userObj = {
          _id: userId,
          username: username,
        };

        updatedVotes.push({
          user: userObj, // Use the user object instead of just the ID
          vote: value,
        });
      }

      // Update the current issue immediately
      setCurrentIssue((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          votes: updatedVotes,
          status: "Voting",
        };
      });

      // Update the voting users list with all current voters
      const newVotingUsers = updatedVotes.map((vote) => {
        const voteUserId =
          typeof vote.user === "string" ? vote.user : vote.user._id;
        const voteUsername =
          typeof vote.user === "string"
            ? voteUserId === userId
              ? username
              : "Unknown"
            : vote.user.username;

        return {
          userId: voteUserId,
          username: voteUsername,
        };
      });

      setVotingUsers(newVotingUsers);

      // Also update the issues list to keep everything in sync
      setIssues((prevIssues) => {
        return prevIssues.map((issue) => {
          if (issue._id === currentIssue._id) {
            return {
              ...issue,
              votes: updatedVotes,
              status: "Voting",
            };
          }
          return issue;
        });
      });

      try {
        // Send the vote to the server (this will trigger socket events for other users)
        await fetch(
          `https://focusflow-production.up.railway.app/api/projects/${id}/poker/issue/${currentIssue._id}/vote`,
          {
            method: "POST",
            body: JSON.stringify({ vote: value }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } catch (error: any) {
        console.error("Error recording vote:", error);
        setError(`Error recording vote: ${error.message}`);
      }
    }
  };

  const handleRevealVotes = async () => {
    if (currentIssue && id) {
      setIsUpdating(true);

      // Optimistically update the UI immediately for instant feedback
      setCurrentIssue((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "Revealed" };
      });

      setVotesRevealed(true);

      // If we have votes, update the vote stats immediately
      if (currentIssue.votes && currentIssue.votes.length > 0) {
        updateVoteStats(currentIssue.votes);
      }

      // Also update the issues list to keep everything in sync
      setIssues((prevIssues) => {
        return prevIssues.map((issue) => {
          if (issue._id === currentIssue._id) {
            return {
              ...issue,
              status: "Revealed",
            };
          }
          return issue;
        });
      });

      try {
        // Send the reveal request to the server (this will trigger socket events for other users)
        await fetch(
          `https://focusflow-production.up.railway.app/api/projects/${id}/poker/issue/${currentIssue._id}/reveal`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } catch (error: any) {
        console.error("Error revealing votes:", error);
        setError(`Error revealing votes: ${error.message}`);

        // Revert the optimistic updates if the API call fails
        setCurrentIssue((prev) => {
          if (!prev) return prev;
          return { ...prev, status: "Voting" };
        });
        setVotesRevealed(false);

        // Revert the issues list update
        setIssues((prevIssues) => {
          return prevIssues.map((issue) => {
            if (issue._id === currentIssue._id) {
              return {
                ...issue,
                status: "Voting",
              };
            }
            return issue;
          });
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleRevote = async () => {
    if (currentIssue && id) {
      setIsUpdating(true);

      // Optimistically update the UI immediately for instant feedback
      setCurrentIssue((prev) => {
        if (!prev) return prev;
        return { ...prev, votes: [], status: "Not Started" };
      });

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
      setSelectedCard(null);

      // Also update the issues list to keep everything in sync
      setIssues((prevIssues) => {
        return prevIssues.map((issue) => {
          if (issue._id === currentIssue._id) {
            return {
              ...issue,
              votes: [],
              status: "Not Started",
            };
          }
          return issue;
        });
      });

      try {
        // Send the revote request to the server (this will trigger socket events for other users)
        await fetch(
          `https://focusflow-production.up.railway.app/api/projects/${id}/poker/issue/${currentIssue._id}/revote`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } catch (error: any) {
        console.error("Error resetting votes:", error);
        setError(`Error resetting votes: ${error.message}`);

        // If the API call fails, revert to previous state
        setCurrentIssue((prev) => {
          if (!prev) return prev;
          return { ...prev, status: "Revealed" };
        });

        setVotesRevealed(true);

        // Revert the issues list update (status only, since we've lost the votes)
        setIssues((prevIssues) => {
          return prevIssues.map((issue) => {
            if (issue._id === currentIssue._id) {
              return {
                ...issue,
                status: "Revealed",
              };
            }
            return issue;
          });
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleValidate = () => {
    // Only project owner can validate
    if (!isProjectOwner) {
      setError("Only the project owner can validate issues.");
      return;
    }

    // Get all revealed issues
    const revealedIssues = issues.filter(
      (issue) => issue.status === "Revealed"
    );
    if (revealedIssues.length === 0) {
      setError("No issues with revealed votes to validate.");
      return;
    }

    // Calculate vote stats for each issue and set default assignees
    const validationIssues: ValidationIssue[] = revealedIssues.map((issue) => {
      const votes = issue.votes || [];
      const numericVotes = votes
        .map((v) => (v.vote ? Number.parseInt(v.vote, 10) : 0))
        .filter((v: number) => !isNaN(v) && v !== null);

      let mostCommon = 0;
      if (numericVotes.length > 0) {
        const voteCounts: { [key: number]: number } = {};
        numericVotes.forEach((v) => {
          voteCounts[v] = (voteCounts[v] || 0) + 1;
        });
        let maxCount = 0;
        Object.entries(voteCounts).forEach(([vote, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommon = Number.parseInt(vote);
          }
        });
      }

      // Find the member whose vote is closest to the most common
      let closestMemberId = project?.members[0]?._id || "";
      let minDifference = Number.POSITIVE_INFINITY;
      votes.forEach((vote) => {
        const voteValue = Number.parseInt(vote.vote, 10);
        if (!isNaN(voteValue)) {
          const difference = Math.abs(voteValue - mostCommon);
          if (difference < minDifference) {
            minDifference = difference;
            closestMemberId =
              typeof vote.user === "string" ? vote.user : vote.user._id;
          }
        }
      });

      // Use the issue's existing deadline if available, otherwise default to 7 days from now
      let initialDeadline;
      if (issue.deadline) {
        initialDeadline = new Date(issue.deadline);
      } else {
        initialDeadline = new Date();
        initialDeadline.setDate(initialDeadline.getDate() + 7); // Default to 7 days if no deadline
      }

      return {
        issue: { ...issue, finalEstimate: mostCommon.toString() },
        selectedMemberId: closestMemberId,
        deadline: initialDeadline,
      };
    });

    setValidationIssues(validationIssues);
    setShowValidationPopup(true);
  };

  const submitValidation = async () => {
    if (!selectedSprintId) {
      setError("Please select a sprint.");
      return;
    }

    setIsUpdating(true);
    try {
      // Calculate the delay (in days) for each issue based on the selected deadline
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

      const issuesWithDelay = validationIssues.map((valIssue) => {
        const deadline = new Date(valIssue.deadline);
        deadline.setHours(0, 0, 0, 0); // Normalize to start of day

        // Calculate the difference in days between the deadline and current date
        const timeDifference = deadline.getTime() - currentDate.getTime();
        const delayInDays = Math.max(
          0,
          Math.floor(timeDifference / (1000 * 60 * 60 * 24))
        ); // Ensure delay is non-negative

        return {
          issueId: valIssue.issue._id,
          finalEstimate: valIssue.issue.finalEstimate,
          sprintId: selectedSprintId,
          assignedTo: valIssue.selectedMemberId,
          delay: delayInDays,
        };
      });

      // Batch validate all issues
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/projects/${id}/poker/batch-validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            issues: issuesWithDelay,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to validate issues: ${errorText}`);
      }

      // We've removed the code that adds tasks to users' Kanban boards
      // Tasks will only be added to the project sprint Kanban

      // Close the validation popup and reset the form
      setShowValidationPopup(false);
      setValidationIssues([]);
      setCurrentIssue(null);
      setVotesRevealed(false);
      setVoteStats({
        average: 0,
        mostCommon: 0,
        range: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
      });
      setVotingUsers([]);
    } catch (error: any) {
      setError(`Error validating issues: ${error.message}`);
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
                    <span
                      className="text-green-400 text-sm flex items-center gap-1 cursor-pointer"
                      title="Socket.IO is connected and real-time updates are working"
                      onClick={() => {
                        console.log("[SOCKET-DEBUG] Connection status clicked");
                        console.log(
                          "[SOCKET-DEBUG] Socket ID:",
                          socketRef.current?.id
                        );
                        console.log(
                          "[SOCKET-DEBUG] Socket connected:",
                          socketRef.current?.connected
                        );
                        console.log(
                          "[SOCKET-DEBUG] Socket transport:",
                          socketRef.current?.io?.engine?.transport?.name
                        );
                        console.log(
                          "[SOCKET-DEBUG] Socket namespace:",
                          socketRef.current?.nsp
                        );
                        console.log(
                          "[SOCKET-DEBUG] Socket event names:",
                          socketRef.current?.eventNames()
                        );
                      }}
                    >
                      <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                      Real-time connected
                    </span>
                  ) : (
                    <div className="flex flex-col">
                      <span
                        className="text-red-400 text-sm flex items-center gap-1 cursor-pointer"
                        title="Socket.IO is disconnected. Real-time updates are not working."
                        onClick={() => {
                          console.log(
                            "[SOCKET-DEBUG] Disconnected status clicked"
                          );
                          console.log(
                            "[SOCKET-DEBUG] Attempting to reconnect socket"
                          );
                          if (
                            socketRef.current &&
                            !socketRef.current.connected
                          ) {
                            socketRef.current.connect();
                            console.log(
                              "[SOCKET-DEBUG] Manual reconnect attempt initiated"
                            );
                          }
                        }}
                      >
                        <span className="w-2 h-2 bg-red-400 rounded-full inline-block animate-ping"></span>
                        Disconnected (click to reconnect)
                      </span>
                      <span className="text-gray-400 text-xs ml-3 mt-1">
                        Updates may be delayed. Votes will still be saved.
                      </span>
                    </div>
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
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
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
                      `https://focusflow-production.up.railway.app/api/projects/${id}/poker/issue/${issueId}`,
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
                    {currentIssue?.deadline && (
                      <div className="flex items-center text-gray-400 mb-4">
                        <Clock size={16} className="mr-2" />
                        Due date:{" "}
                        {new Date(currentIssue.deadline).toLocaleDateString()}
                      </div>
                    )}
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
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
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
                              <span>
                                {user.userId === currentUserId
                                  ? localStorage.getItem("username") || "You"
                                  : user.username}
                              </span>
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
                                  <span>
                                    {user.userId === currentUserId
                                      ? localStorage.getItem("username") ||
                                        "You"
                                      : user.username}
                                    :
                                  </span>
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

      {/* Validation Popup - Update colors */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-xl border border-gray-700 p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                Validate Revealed Issues
              </h3>
              <button
                onClick={() => setShowValidationPopup(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">
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

            <div className="overflow-x-auto">
              <div className="bg-black/50 rounded-lg border border-gray-700 shadow-lg">
                <table className="w-full text-left text-gray-300">
                  <thead>
                    <tr className="bg-gray-800/70 text-gray-100">
                      <th className="p-4 font-semibold text-sm uppercase tracking-wide border-b border-gray-700">
                        Issue
                      </th>
                      <th className="p-4 font-semibold text-sm uppercase tracking-wide border-b border-gray-700">
                        Final Estimate
                      </th>
                      <th className="p-4 font-semibold text-sm uppercase tracking-wide border-b border-gray-700">
                        Votes
                      </th>
                      <th className="p-4 font-semibold text-sm uppercase tracking-wide border-b border-gray-700">
                        Assign To
                      </th>
                      <th className="p-4 font-semibold text-sm uppercase tracking-wide border-b border-gray-700">
                        Deadline
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationIssues.map((valIssue, index) => {
                      const votes = valIssue.issue.votes || [];
                      return (
                        <tr
                          key={valIssue.issue._id}
                          className={`border-b border-gray-700/50 transition-colors ${
                            index % 2 === 0 ? "bg-[#1E1E1E]" : "bg-black/30"
                          } hover:bg-gray-700/50`}
                        >
                          <td className="p-4 text-gray-200">
                            {valIssue.issue.title}
                          </td>
                          <td className="p-4 text-red-400 font-medium">
                            {valIssue.issue.finalEstimate}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 flex-wrap">
                              {votes.map((vote) => (
                                <span
                                  key={
                                    typeof vote.user === "string"
                                      ? vote.user
                                      : vote.user._id
                                  }
                                  className="bg-gray-700/50 rounded-full px-2 py-1 text-xs"
                                >
                                  {typeof vote.user === "string"
                                    ? vote.user === currentUserId
                                      ? localStorage.getItem("username") ||
                                        "You"
                                      : "Unknown"
                                    : vote.user._id === currentUserId
                                    ? localStorage.getItem("username") || "You"
                                    : vote.user.username}{" "}
                                  :{" "}
                                  <span className="text-red-400">
                                    {vote.vote}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <select
                              value={valIssue.selectedMemberId}
                              onChange={(e) => {
                                setValidationIssues((prev) =>
                                  prev.map((item, i) =>
                                    i === index
                                      ? {
                                          ...item,
                                          selectedMemberId: e.target.value,
                                        }
                                      : item
                                  )
                                );
                              }}
                              className="bg-black/50 text-white p-2 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 w-full max-w-xs"
                            >
                              {project?.members.map((member) => (
                                <option key={member._id} value={member._id}>
                                  {member.username}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4">
                            <input
                              type="date"
                              value={
                                valIssue.deadline.toISOString().split("T")[0]
                              } // Format date as YYYY-MM-DD
                              onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                if (!isNaN(newDate.getTime())) {
                                  setValidationIssues((prev) =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? { ...item, deadline: newDate }
                                        : item
                                    )
                                  );
                                }
                              }}
                              min={new Date().toISOString().split("T")[0]} // Prevent past dates
                              className="bg-black/50 text-white p-2 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 w-full max-w-[150px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowValidationPopup(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={submitValidation}
                disabled={isUpdating || !selectedSprintId}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Validating..." : "Validate All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanningSession;
