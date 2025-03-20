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
  EyeOff,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Issue, Vote } from "../../types";

const CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "?"];

interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}

interface DecodedToken {
  id: string;
  [key: string]: any;
}

interface VotingUser {
  userId: string;
  username: string;
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
    range: { min: Infinity, max: -Infinity },
  });
  const [votingUsers, setVotingUsers] = useState<VotingUser[]>([]);
  const socket = useRef(
    io("https://focusflow-production.up.railway.app", {
      withCredentials: true,
    })
  );

  const getUserId = (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!id) return;

    console.log("Setting up Socket.IO listeners for projectId:", id);
    socket.current.emit("joinRoom", id);

    socket.current.on("connect", () => {
      console.log("Socket.IO connected:", socket.current.id);
    });

    socket.current.on(
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
        console.log("Current issue:", currentIssue?._id);
        setIssues((prevIssues) => {
          console.log("Previous issues state:", prevIssues);
          const updatedIssues = prevIssues.map((issue) =>
            issue._id === issueId
              ? {
                  ...issue,
                  votes: issue.votes?.some((v) => {
                    const user = v.user;
                    return typeof user === "string"
                      ? user === userId
                      : user._id === userId;
                  })
                    ? issue.votes.map((v) => {
                        const user = v.user;
                        return (
                          typeof user === "string"
                            ? user === userId
                            : user._id === userId
                        )
                          ? { ...v, vote }
                          : v;
                      })
                    : [
                        ...(issue.votes || []),
                        { user: { _id: userId, username }, vote },
                      ],
                }
              : issue
          );
          console.log("Updated issues state:", updatedIssues);
          return updatedIssues;
        });

        // Update voting users if the updated issue is the current issue
        if (currentIssue?._id === issueId) {
          setVotingUsers((prev) => {
            const newUsers = prev.some((u) => u.userId === userId)
              ? prev.map((u) =>
                  u.userId === userId ? { userId, username } : u
                )
              : [...prev, { userId, username }];
            return newUsers;
          });
          // Update currentIssue to reflect the latest votes
          setCurrentIssue((prev) => {
            if (!prev || prev._id !== issueId) return prev;
            const updatedIssue = issues.find((i) => i._id === issueId);
            return updatedIssue ? { ...prev, votes: updatedIssue.votes } : prev;
          });
        }
      }
    );

    socket.current.on(
      "votesRevealed",
      ({ issueId, votes }: { issueId: string; votes: Vote[] }) => {
        console.log("Received votesRevealed event:", { issueId, votes });
        setIssues((prevIssues) =>
          prevIssues.map((issue) =>
            issue._id === issueId ? { ...issue, votes } : issue
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
          // Update currentIssue to reflect the revealed votes
          setCurrentIssue((prev) => (prev ? { ...prev, votes } : prev));
        }
      }
    );

    socket.current.on("issueAdded", ({ issue }: { issue: Issue }) => {
      setIssues((prevIssues) => [...prevIssues, issue]);
    });

    socket.current.on("issueDeleted", ({ issueId }: { issueId: string }) => {
      setIssues((prevIssues) =>
        prevIssues.filter((issue) => issue._id !== issueId)
      );
      if (currentIssue && currentIssue._id === issueId) {
        setCurrentIssue(null);
        setVotesRevealed(false);
        setVoteStats({
          average: 0,
          mostCommon: 0,
          range: { min: Infinity, max: -Infinity },
        });
        setVotingUsers([]);
      }
    });

    return () => {
      console.log("Disconnecting Socket.IO");
      socket.current.disconnect();
    };
  }, [id, currentIssue]);

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
  }, [id]);

  // Update voteStats, votingUsers, and currentIssue whenever issues changes
  useEffect(() => {
    if (currentIssue) {
      const updatedIssue = issues.find((i) => i._id === currentIssue._id);
      if (updatedIssue) {
        setCurrentIssue(updatedIssue); // Sync currentIssue with the latest data from issues
        updateVoteStats(updatedIssue.votes || []);
        setVotingUsers(
          (updatedIssue.votes || []).map((vote) => ({
            userId: typeof vote.user === "string" ? vote.user : vote.user._id,
            username:
              typeof vote.user === "string" ? "Unknown" : vote.user.username,
          }))
        );
      }
    } else {
      setVotingUsers([]);
    }
  }, [issues]);

  const fetchPokerSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("❌ No token found, redirecting to login.");
      navigate("/signin");
      return;
    }

    try {
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
      console.log("Fetched poker session data:", data);
      setIssues(data.issues || []);
    } catch (error: any) {
      setError(`Error fetching poker session: ${error.message}`);
    }
  };

  const handleVote = async (value: string) => {
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
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to record vote:", errorText);
          setError(`Failed to record vote: ${errorText}`);
          return;
        }
        console.log("Vote recorded, emitting vote event...");
        socket.current.emit("vote", {
          projectId: id,
          issueId: currentIssue._id,
          vote: value,
          userId,
        });

        // Fetch the latest data after voting as a fallback
        console.log("Fetching updated poker session data after vote...");
        await fetchPokerSession();
      } catch (error: any) {
        console.error("Error recording vote:", error);
        setError(`Error recording vote: ${error.message}`);
      }
    }
  };

  const handleRevealVotes = async () => {
    if (!votesRevealed && currentIssue) {
      setIsUpdating(true);
      socket.current.emit("revealVotes", {
        projectId: id,
        issueId: currentIssue._id,
      });
      setVotesRevealed(true);
      const currentIssueVotes =
        issues.find((i) => i._id === currentIssue._id)?.votes || [];
      updateVoteStats(currentIssueVotes);
      setIsUpdating(false);
    } else {
      setVotesRevealed(false);
    }
  };

  const updateVoteStats = (votes: Vote[] = []) => {
    console.log("Votes passed to updateVoteStats:", votes);
    const allVotes = votes
      .map((v) => (v.vote ? parseInt(v.vote, 10) : 0))
      .filter((v: number) => !isNaN(v) && v !== null);
    console.log("Parsed votes:", allVotes);
    if (allVotes.length === 0) {
      setVoteStats({
        average: 0,
        mostCommon: 0,
        range: { min: Infinity, max: -Infinity },
      });
      return;
    }
    const average = allVotes.reduce((a, b) => a + b, 0) / allVotes.length;
    const mostCommon =
      allVotes
        .sort(
          (a, b) =>
            allVotes.filter((v) => v === a).length -
            allVotes.filter((v) => v === b).length
        )
        .pop() || 0;
    const range = { min: Math.min(...allVotes), max: Math.max(...allVotes) };
    console.log("Calculated stats:", { average, mostCommon, range });
    setVoteStats({ average, mostCommon, range });
  };

  const handleIssueSelect = (issue: Issue) => {
    setCurrentIssue(issue);
    setSelectedCard(null);
    setVotesRevealed(false);
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
                <p className="text-gray-400 flex items-center gap-2 mt-2">
                  <Users size={20} />
                  {issues.length} issues
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={copyInviteLink}
                  className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg hover:bg-black/50 transition-colors text-gray-300 hover:text-white"
                >
                  <Copy size={20} />
                  Copy Invite Link
                </button>
                <button
                  onClick={handleRevealVotes}
                  disabled={isUpdating || !currentIssue}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <span>Loading...</span>
                  ) : votesRevealed ? (
                    <>
                      <EyeOff size={20} />
                      Hide Votes
                    </>
                  ) : (
                    <>
                      <Eye size={20} />
                      Reveal Votes
                    </>
                  )}
                </button>
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
                    {currentIssue.description && (
                      <p className="text-gray-400 mb-6">
                        {currentIssue.description}
                      </p>
                    )}
                    {/* Display the list of voting users */}
                    <div className="mb-6 p-3 bg-black/30 rounded-lg border border-gray-700">
                      <p className="text-gray-400">
                        {votingUsers.length} user
                        {votingUsers.length !== 1 ? "s" : ""} have voted
                      </p>
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
                    </div>
                    {votesRevealed && (
                      <div className="mb-6 p-3 bg-black/30 rounded-lg border border-gray-700">
                        <div className="grid grid-cols-3 gap-4">
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
                              {voteStats.range.min === Infinity
                                ? "Infinity"
                                : voteStats.range.min}{" "}
                              -{" "}
                              {voteStats.range.max === -Infinity
                                ? "-Infinity"
                                : voteStats.range.max}
                            </span>
                          </div>
                        </div>
                        {/* Display individual votes when revealed */}
                        {votesRevealed && (
                          <div className="mt-4">
                            <h3 className="text-gray-400 mb-2">Votes</h3>
                            <div className="flex gap-2 flex-wrap">
                              {votingUsers.map((user) => {
                                const userVote = currentIssue.votes?.find(
                                  (v) => {
                                    const voteUser = v.user;
                                    return typeof voteUser === "string"
                                      ? voteUser === user.userId
                                      : voteUser._id === user.userId;
                                  }
                                )?.vote;
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
                          </div>
                        )}
                        {voteStats.average === voteStats.mostCommon &&
                          voteStats.average !== 0 && (
                            <p className="text-green-500 mt-2 flex items-center gap-1">
                              <CheckCircle2 size={16} />
                              High Agreement
                            </p>
                          )}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      {CARD_VALUES.map((value) => (
                        <Card
                          key={value}
                          value={value}
                          selected={selectedCard === value}
                          onClick={() => handleVote(value)}
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
    </div>
  );
}

export default PlanningSession;
