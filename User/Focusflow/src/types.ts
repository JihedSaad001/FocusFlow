// Define interfaces for type safety
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

