// Define interfaces for type safety

// Original interfaces
export interface Task {
  _id: string
  title: string
  description?: string
  priority: "Low" | "Medium" | "High"
  assignedTo?: string
  deadline?: string
  status?: "To Do" | "In Progress" |"Testing"|"Blocked"| "Done"
  finalEstimate?: string
  icon?: string
  // Add these properties for kanban integration
  projectId?: string
  sprintId?: string
  originalTaskId?: string
}

export interface Sprint {
  _id: string
  name: string
  tasks: Task[]
  active: boolean
  startDate?: string
  endDate?: string
  goals: string[]
  reviewNotes?: string[]
  retrospectiveNotes?: string[]
}

export interface Project {
  _id: string
  name: string
  description: string
  owner: { _id: string; username: string }
  members: { _id: string; username: string; email: string }[]
  backlog: Task[]
  sprints: Sprint[]
  activePokerSession?: {
    issues: {
      _id: string
      title: string
      description: string
      status: "Not Started" | "Voting" | "Revealed" | "Finished"
      finalEstimate?: string
      votes: { user: string | { _id: string; username: string }; vote: string }[]
    }[]
  }
  chatMessages?: ChatMessage[]
  createdAt?: string
  updatedAt?: string
}

export interface Column {
  id: string
  title: string
  tasks: Task[]
}

export interface Board {
  columns: Column[]
}

export interface ChatMessage {
  user: { _id: string; username: string; profilePic?: string }
  message: string
  timestamp: string
}

export interface Issue {
  _id: string
  title: string
  description: string
  status: "Not Started" | "Voting" | "Revealed" | "Finished"
  finalEstimate?: string
  votes?: { user: string | { _id: string; username: string }; vote: string }[]
  deadline?: string;
}

export interface Vote {
  user: string | { _id: string; username: string }
  vote: string
}

export interface DecodedToken {
  id: string
  username: string
  email: string
  iat: number
  exp: number
}

// User model interfaces
export interface User {
  username: string;
  email: string;
  profilePic?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  taskIds: string[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

export interface KanbanTask {
  id: string;
  content: string;
  description?: string;
  projectId?: string;
  sprintId?: string;
  taskId?: string;
  isProjectTask?: boolean;
}

export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface FocusSession {
  duration: number;
  completed: boolean;
  ambientSound?: string;
  timestamp: string;
}

export interface FocusTimeEntry {
  date: string;
  duration: number;
}

export interface DailyTaskEntry {
  date: string;
  count: number;
}

export interface UserStats {
  focusSessions: FocusSession[];
  tasksCompleted: number;
  xp: number;
  level: number;
  focusTime: FocusTimeEntry[];
  dailyTasks: DailyTaskEntry[];
  streakDays: number;
  lastActive: string;
  lastStreakUpdate?: string;
}

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface UserData {
  wallpaper?: string;
  pomodoroSettings?: PomodoroSettings;
  tasks?: KanbanTask[];
  kanbanBoard?: KanbanBoard;
  todoTasks?: TodoTask[];
  stats?: UserStats;
}

// Project model interfaces
export interface ProjectMember {
  _id: string;
  username: string;
  email: string;
  profilePic?: string;
}

export interface PokerIssue {
  _id: string;
  title: string;
  description: string;
  status: 'Not Started' | 'Voting' | 'Revealed' | 'Finished';
  votes: Vote[];
  finalEstimate?: number;
  assignedTo?: string;
}

export interface PokerSession {
  issues: PokerIssue[];
}

// Resource model interfaces
export interface Resource {
  _id: string;
  type: 'wallpaper' | 'audio' | 'music';
  name: string;
  url: string;
  category?: string;
  tags?: string[];
  uploadedBy?: string;
  format?: string;
  duration?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallpaper extends Resource {
  type: 'wallpaper';
  category: 'nature' | 'abstract' | 'dark' | 'minimal';
}

export interface AmbientSound extends Resource {
  type: 'audio';
  format: 'mp3' | 'wav' | 'ogg';
  duration: number;
}

export interface Music extends Resource {
  type: 'music';
  format: 'mp3' | 'wav' | 'ogg';
  duration: number;
}
