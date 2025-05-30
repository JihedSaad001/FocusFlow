// Define interfaces for type safety

// Original interfaces
export interface Task {
  _id: string
  title: string
  description?: string
  priority: "Low" | "Medium" | "High"
  assignedTo?: string
  deadline?: string
  status?: string
  finalEstimate?: string
  icon?: string
}
export interface TaskCardProps {
  task: Task;
  columnType: "todo" | "inProgress" | "testing" | "blocked" | "done";
  updateTaskStatus: (
    taskId: string,
    status: "To Do" | "In Progress" | "Testing" | "Blocked" | "Done"
  ) => void;
  deleteTaskFromSprint: (taskId: string) => void;
  getMemberName: (memberId: string | undefined) => string;
}
export interface Sprint {
  _id: string
  name: string
  tasks: Task[]
  active: boolean
  startDate?: string
  endDate?: string
  goals: string[]
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
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

export interface KanbanTask {
  id: string;
  content: string;
  description?: string;
}

export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

// Dashboard-specific interfaces (moved from Dashboard.tsx)
export interface DashboardTodoTask {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// NewsSection interfaces (moved from NewsSection.tsx)
export interface Article {
  id: number;
  title: string;
  url: string;
  published_at: string;
  user: {
    name: string;
  };
}

export interface ProductivityTip {
  id: number;
  tip: string;
  source: string;
}

export interface FocusSession {
  duration: number;
  completed: boolean;
  ambientSound: string;
  timestamp: Date;
}

export interface FocusTimeEntry {
  date: string | Date;
  duration: number;
}

export interface DailyTaskEntry {
  date: string | Date;
  count: number;
}

export interface UserStats {
  focusSessions: FocusSession[];
  tasksCompleted: number;
  xp: number;
  level: number;
  focusTime: FocusTimeEntry[];
  dailyTasks: DailyTaskEntry[];
  todoTasks?: DashboardTodoTask[];
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
  isActive: boolean;
}

export interface Wallpaper extends Resource {
  type: 'wallpaper';
  category: 'nature' | 'abstract' | 'dark' | 'minimal';
}

export interface AmbientSound extends Resource {
  type: 'audio';
  format: 'mp3' | 'wav' | 'ogg';
}

export interface Music extends Resource {
  type: 'music';
  format: 'mp3' | 'wav' | 'ogg';
}
