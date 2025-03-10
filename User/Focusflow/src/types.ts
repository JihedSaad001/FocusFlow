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