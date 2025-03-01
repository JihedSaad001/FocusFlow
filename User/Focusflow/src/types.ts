export interface Task {
    id: string;
    title: string;
    assignee?: {
      name: string;
      avatar?: string;
    };
    priority: 'Low' | 'Medium' | 'High';
    date: string;
    icon?: string;
  }
  
  export type Column = {
    id: string;
    title: string;
    tasks: Task[];
  };
  
  export type Board = {
    columns: Column[];
  };