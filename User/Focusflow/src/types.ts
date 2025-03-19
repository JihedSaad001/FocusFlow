// types/index.ts
export interface Task {
  id: string;
  title: string;
  priority: "Low" | "Medium" | "High";
  date?: string;
  icon?: string;
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
  status?: string;
  votes?: Vote[];
}