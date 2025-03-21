export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: "Low" | "Medium" | "High";
  status?: "To Do" | "In Progress" | "Done";
  assignedTo?: string;
  deadline?: string;
  icon?: string;
  finalEstimate?: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Board {
  columns: Column[];
}

export interface PopulatedUser {
  _id: string;
  username: string;
}

export interface Vote {
  user: string | PopulatedUser;
  vote: string;
}

export interface Issue {
  _id: string;
  title: string;
  description?: string;
  status?: "Not Started" | "Voting" | "Revealed" | "Finished";
  votes?: Vote[];
  finalEstimate?: string;
}