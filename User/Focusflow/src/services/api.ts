import axios from 'axios';

// Base URL for API calls
const API_URL = 'https://focusflow-production.up.railway.app/api'; // Updated to match the new backend port

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Adding token to request:', config.url);
  } else {
    console.warn('No token found for request:', config.url);
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Success: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.config?.url}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Register a new user
  register: async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/signup', { username, email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login a user
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout a user
  logout: () => {
    localStorage.removeItem('token');
  },

  // Verify email
  verifyEmail: async (token: string) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend verification email
  resendVerification: async (email: string) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token: string, password: string) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData: any) => {
    try {
      const response = await api.put('/auth/update-user', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload profile picture
  uploadProfilePic: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/auth/upload-profile-pic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Google login
  googleLogin: async (accessToken: string) => {
    try {
      const response = await api.post('/auth/google-login', { access_token: accessToken });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User data API
export const userDataAPI = {
  // Get user data
  getUserData: async () => {
    try {
      const response = await api.get('/user/data');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update kanban board
  updateKanbanBoard: async (kanbanBoard: any) => {
    try {
      const response = await api.put('/user/kanban', kanbanBoard);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get kanban board
  getKanbanBoard: async () => {
    try {
      const response = await api.get('/user/kanban');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add project task to kanban
  addProjectTaskToKanban: async (projectId: string, sprintId: string, taskId: string) => {
    try {
      const response = await api.post('/user/kanban/project-task', { projectId, sprintId, taskId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get todo tasks
  getTodoTasks: async () => {
    try {
      const response = await api.get('/user/todo-tasks');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update todo tasks
  updateTodoTasks: async (tasks: any[]) => {
    try {
      const response = await api.put('/user/todo-tasks', { tasks });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user stats
  getUserStats: async (timeRange: 'week' | 'month' | 'quarter' = 'week') => {
    try {
      console.log('Fetching user stats with timeRange:', timeRange);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for getUserStats');
        throw new Error('Authentication required');
      }

      const response = await api.get(`/user/stats?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw error;
    }
  },

  // Log focus session
  logFocusSession: async (duration: number, completed: boolean, ambientSound?: string) => {
    try {
      console.log('Logging focus session:', { duration, completed, ambientSound });
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for logFocusSession');
        throw new Error('Authentication required');
      }

      const response = await api.post('/user/log-focus-session', { duration, completed, ambientSound });
      return response.data;
    } catch (error) {
      console.error('Error in logFocusSession:', error);
      throw error;
    }
  },

  // Log completed task
  logCompletedTask: async (taskId: string) => {
    try {
      console.log('Logging completed task:', taskId);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for logCompletedTask');
        throw new Error('Authentication required');
      }

      const response = await api.post('/user/log-completed-task', { taskId });
      return response.data;
    } catch (error) {
      console.error('Error in logCompletedTask:', error);
      throw error;
    }
  },

  // AI insights functionality removed
};

// Project API
export const projectAPI = {
  // Create a new project
  createProject: async (name: string, description: string) => {
    try {
      const response = await api.post('/projects', { name, description });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all projects for a user
  getUserProjects: async () => {
    try {
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific project by ID
  getProjectById: async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a project
  updateProject: async (projectId: string, name: string, description: string) => {
    try {
      const response = await api.put(`/projects/${projectId}`, { name, description });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a project
  deleteProject: async (projectId: string) => {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add a member to a project
  addProjectMember: async (projectId: string, email: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/members`, { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Remove a member from a project
  removeProjectMember: async (projectId: string, memberId: string) => {
    try {
      const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Start a poker session
  startPokerSession: async (projectId: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/poker/start`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get the poker session
  getPokerSession: async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/poker`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add an issue to the poker session
  addPokerIssue: async (projectId: string, title: string, description: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/poker/issue`, { title, description });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Vote on a poker issue
  voteOnPokerIssue: async (projectId: string, issueId: string, vote: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/poker/issue/${issueId}/vote`, { vote });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request revote for a poker issue
  requestRevote: async (projectId: string, issueId: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/poker/issue/${issueId}/revote`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate a poker issue
  validatePokerIssue: async (
    projectId: string,
    issueId: string,
    finalEstimate: number,
    sprintId: string,
    assignedTo?: string,
    delay?: number
  ) => {
    try {
      const response = await api.post(`/projects/${projectId}/poker/issue/${issueId}/validate`, {
        finalEstimate,
        sprintId,
        assignedTo,
        delay,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Batch validate poker issues
  batchValidatePokerIssues: async (
    projectId: string,
    issues: Array<{
      issueId: string;
      finalEstimate: number;
      sprintId: string;
      assignedTo?: string;
      deadline?: string;
    }>
  ) => {
    try {
      const response = await api.post(`/projects/${projectId}/poker/batch-validate`, { issues });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reveal votes for a poker issue
  revealPokerIssue: async (projectId: string, issueId: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/poker/issue/${issueId}/reveal`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get chat messages
  getChatMessages: async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/chat`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add a task to backlog
  addBacklogTask: async (
    projectId: string,
    title: string,
    description: string,
    priority: string,
    assignedTo?: string,
    deadline?: string
  ) => {
    try {
      const response = await api.post(`/projects/${projectId}/backlog`, {
        title,
        description,
        priority,
        assignedTo,
        deadline,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new sprint
  createSprint: async (
    projectId: string,
    name: string,
    startDate?: string,
    endDate?: string,
    goals?: string[]
  ) => {
    try {
      const response = await api.post(`/projects/${projectId}/sprints`, {
        name,
        startDate,
        endDate,
        goals,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add a task to a sprint
  addTaskToSprint: async (
    projectId: string,
    sprintId: string,
    taskId: string,
    assignedTo?: string,
    deadline?: string
  ) => {
    try {
      const response = await api.post(`/projects/${projectId}/sprints/${sprintId}/tasks`, {
        taskId,
        assignedTo,
        deadline,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (projectId: string, sprintId: string, taskId: string, status: string) => {
    try {
      const response = await api.put(`/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a task from backlog
  deleteBacklogTask: async (projectId: string, taskId: string) => {
    try {
      const response = await api.delete(`/projects/${projectId}/backlog/${taskId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a sprint
  deleteSprint: async (projectId: string, sprintId: string) => {
    try {
      const response = await api.delete(`/projects/${projectId}/sprints/${sprintId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a task from a sprint
  deleteSprintTask: async (projectId: string, sprintId: string, taskId: string) => {
    try {
      const response = await api.delete(`/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a poker issue
  deletePokerIssue: async (projectId: string, issueId: string) => {
    try {
      const response = await api.delete(`/projects/${projectId}/poker/issue/${issueId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Resource API
export const resourceAPI = {
  // Get all wallpapers
  getWallpapers: async () => {
    try {
      const response = await api.get('/resources/wallpapers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all ambient sounds
  getAmbientSounds: async () => {
    try {
      const response = await api.get('/resources/ambient-sounds');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all music tracks
  getMusic: async () => {
    try {
      const response = await api.get('/resources/music');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific wallpaper by ID
  getWallpaperById: async (id: string) => {
    try {
      const response = await api.get(`/resources/wallpapers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Add a resource manually
  addResource: async (
    type: 'wallpaper' | 'audio' | 'music',
    name: string,
    url: string,
    category?: string,
    tags?: string[]
  ) => {
    try {
      const response = await api.post('/resources/add', { type, name, url, category, tags });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Upload a wallpaper
  uploadWallpaper: async (file: File, category: string, tags?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (tags) formData.append('tags', tags);

      const response = await api.post('/resources/upload-wallpaper', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Upload an audio file
  uploadAudio: async (file: File, name: string, tags?: string, duration?: number) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (tags) formData.append('tags', tags);
      if (duration) formData.append('duration', duration.toString());

      const response = await api.post('/resources/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Upload a music file
  uploadMusic: async (file: File, name: string, tags?: string, duration?: number) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (tags) formData.append('tags', tags);
      if (duration) formData.append('duration', duration.toString());

      const response = await api.post('/resources/upload-music', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Delete a resource
  deleteResource: async (id: string) => {
    try {
      const response = await api.delete(`/resources/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Admin API
export const adminAPI = {
  // Admin login
  adminLogin: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/admin-login', { email, password });
      localStorage.setItem('adminToken', response.data.token);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (userId: string, role: 'user' | 'admin') => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await api.get('/admin/stats/users');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get project statistics
  getProjectStats: async () => {
    try {
      const response = await api.get('/admin/stats/projects');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all users with project counts
  getUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
