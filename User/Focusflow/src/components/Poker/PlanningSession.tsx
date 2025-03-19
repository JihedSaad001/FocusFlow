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
import { Issue, Vote } from "../../types"; // Removed PopulatedUser

const CARD_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "?"];

interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}

interface DecodedToken {
  id: string;
  [key: string]: any;
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
  const [totalVotes, setTotalVotes] = useState(0);
  const [votingUsers, setVotingUsers] = useState<
    { userId: string; username: string }[]
  >([]);
  const socket = useRef(
    io("https://focusflow-production.up.railway.app", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
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

    // Debug Socket.IO connection
    socket.current.on("connect", () => {
      console.log("Socket.IO connected:", socket.current.id);
      socket.current.emit("joinRoom", id); // Ensure room is joined on reconnect
    });
    socket.current.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });
    socket.current.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
      setError("Real-time updates unavailable. Please refresh manually.");
    });

    // Socket.IO event listeners
    socket.current.on(
      "voteUpdate",
      ({
        issueId,
        vote,
        userId,
        username,
        totalVotes,
      }: {
        issueId: string;
        vote: string;
        userId: string;
        username: string;
        totalVotes: number;
      }) => {
        console.log("Received voteUpdate:", {
          issueId,
          vote,
          userId,
          username,
          totalVotes,
        });
        setIssues((prevIssues: Issue[]) => {
          const newIssues = prevIssues.map((issue) => {
            if (issue._id !== issueId) return issue;
            const updatedVotes = issue.votes?.some((v) => {
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
                ];
            return { ...issue, votes: updatedVotes };
          });
          console.log("Updated issues:", newIssues);
          return [...newIssues]; // Force re-render
        });

        if (currentIssue?._id === issueId) {
          setCurrentIssue((prev: Issue | null) => {
            if (!prev) return prev;
            const updatedVotes = prev.votes?.some((v) => {
              const user = v.user;
              return typeof user === "string"
                ? user === userId
                : user._id === userId;
            })
              ? prev.votes.map((v) => {
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
                  ...(prev.votes || []),
                  { user: { _id: userId, username }, vote },
                ];
            return { ...prev, votes: updatedVotes };
          });
          setTotalVotes(totalVotes);
          setVotingUsers((prev) => {
            const newUsers = prev.some((u) => u.userId === userId)
              ? prev.map((u) =>
                  u.userId === userId ? { userId, username } : u
                )
              : [...prev, { userId, username }];
            return [...newUsers];
          });
          setVoteStats(() => {
            const votes =
              currentIssue?.votes
                ?.map((v) => parseInt(v.vote, 10))
                .filter((v) => !isNaN(v)) || [];
            const average = votes.length
              ? votes.reduce((a, b) => a + b, 0) / votes.length
              : 0;
            const mostCommon = votes.length
              ? votes
                  .sort(
                    (a, b) =>
                      votes.filter((v) => v === a).length -
                      votes.filter((v) => v === b).length
                  )
                  .pop() || 0
              : 0;
            const range = votes.length
              ? { min: Math.min(...votes), max: Math.max(...votes) }
              : { min: 0, max: 0 };
            return { average, mostCommon, range };
          });
        }
      }
    );

    socket.current.on(
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
        console.log("Received votesRevealed:", { issueId, votes, status });
        setIssues((prevIssues: Issue[]) => {
          const newIssues = prevIssues.map((issue) => {
            if (issue._id === issueId) {
              return { ...issue, votes, status };
            }
            return issue;
          });
          return [...newIssues];
        });

        if (currentIssue?._id === issueId) {
          setCurrentIssue((prev: Issue | null) => {
            if (!prev) return prev;
            return { ...prev, votes, status };
          });
          setVotesRevealed(true);
          setVotingUsers(
            votes.map((vote: Vote) => ({
              userId: typeof vote.user === "string" ? vote.user : vote.user._id,
              username:
                typeof vote.user === "string" ? "Unknown" : vote.user.username,
            }))
          );
          setVoteStats(() => {
            const voteValues = votes
              .map((v: Vote) => parseInt(v.vote, 10))
              .filter((v) => !isNaN(v));
            const average = voteValues.length
              ? voteValues.reduce((a, b) => a + b, 0) / voteValues.length
              : 0;
            const mostCommon = voteValues.length
              ? voteValues
                  .sort(
                    (a, b) =>
                      voteValues.filter((v) => v === a).length -
                      voteValues.filter((v) => v === b).length
                  )
                  .pop() || 0
              : 0;
            const range = voteValues.length
              ? { min: Math.min(...voteValues), max: Math.max(...voteValues) }
              : { min: 0, max: 0 };
            return { average, mostCommon, range };
          });
        }
      }
    );

    socket.current.on("issueAdded", ({ issue }: { issue: Issue }) => {
      console.log("Received issueAdded:", issue);
      setIssues((prevIssues: Issue[]) => [...prevIssues, issue]);
    });

    socket.current.on("issueDeleted", ({ issueId }: { issueId: string }) => {
      console.log("Received issueDeleted:", issueId);
      setIssues((prevIssues: Issue[]) =>
        prevIssues.filter((issue) => issue._id !== issueId)
      );
      if (currentIssue?._id === issueId) {
        setCurrentIssue(null);
        setVotesRevealed(false);
        setVoteStats({
          average: 0,
          mostCommon: 0,
          range: { min: Infinity, max: -Infinity },
        });
        setTotalVotes(0);
        setVotingUsers([]);
      }
    });

    console.log("Joining room:", id);
    socket.current.emit("joinRoom", id);

    return () => {
      console.log("Cleaning up Socket.IO listeners");
      socket.current.off("voteUpdate");
      socket.current.off("votesRevealed");
      socket.current.off("issueAdded");
      socket.current.off("issueDeleted");
      socket.current.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!id || id.trim() === "") {
      console.error("Project ID is missing or empty.");
      setError(
        "Project ID is missing or empty. Please navigate to a valid project."
      );
      return;
    }
    fetchPokerSession();
  }, [id]);

  const fetchPokerSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login.");
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

      // Ensure the fetched issues match the Issue type
      const fetchedIssues: Issue[] = (data.issues || []).map((issue: any) => ({
        _id: issue._id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        votes: (issue.votes || []).map((vote: any) => ({
          user:
            typeof vote.user === "string"
              ? vote.user
              : { _id: vote.user._id, username: vote.user.username },
          vote: vote.vote,
        })),
      }));
      setIssues(fetchedIssues);
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
        console.log("Vote recorded successfully");
      } catch (error: any) {
        console.error("Error recording vote:", error);
        setError(`Error recording vote: ${error.message}`);
      }
    }
  };

  const handleRevealVotes = async () => {
    if (!currentIssue) return;
    setIsUpdating(true);
    socket.current.emit("revealVotes", {
      projectId: id,
      issueId: currentIssue._id,
    });
    setIsUpdating(false);
  };

  const handleIssueSelect = (issue: Issue) => {
    console.log("Selected issue:", issue);
    setCurrentIssue(issue);
    setSelectedCard(null);
    setVotesRevealed(false);
    const issueVotes = issue.votes || [];
    setTotalVotes(issueVotes.length);
    setVotingUsers(
      issueVotes.map((vote) => {
        const user = vote.user;
        return {
          userId: typeof user === "string" ? user : user._id,
          username: typeof user === "string" ? "Unknown" : user.username,
        };
      })
    );
    const voteValues = issueVotes
      .map((v) => parseInt(v.vote, 10))
      .filter((v) => !isNaN(v));
    setVoteStats({
      average: voteValues.length
        ? voteValues.reduce((a, b) => a + b, 0) / voteValues.length
        : 0,
      mostCommon: voteValues.length
        ? voteValues
            .sort(
              (a, b) =>
                voteValues.filter((v) => v === a).length -
                voteValues.filter((v) => v === b).length
            )
            .pop() || 0
        : 0,
      range: voteValues.length
        ? { min: Math.min(...voteValues), max: Math.max(...voteValues) }
        : { min: 0, max: 0 },
    });
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
                  onClick={fetchPokerSession}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors text-white"
                >
                  Refresh
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
                  issues={issues}
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
                    <div className="mb-6 p-3 bg-black/30 rounded-lg border border-gray-700">
                      <p className="text-gray-400">
                        {totalVotes} user{totalVotes !== 1 ? "s" : ""} have
                        voted
                      </p>
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
                              {voteStats.range.min} - {voteStats.range.max}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
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
