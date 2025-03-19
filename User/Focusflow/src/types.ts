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

export interface Issue {
  _id: string;
  title: string;
  description?: string;
  status?: string; // Optional status
  votes?: { user: string; vote: string }[];
}