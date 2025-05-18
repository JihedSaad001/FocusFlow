import axios from "axios";

// Get API base URL from environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const fetchResources = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    if (token) {
      // If admin token exists, fetch all wallpapers (active and inactive)
      const response = await axios.get(
        `${API_BASE_URL}/api/resources/admin/wallpapers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } else {
      // Fallback to public endpoint (active only)
      const response = await axios.get(
        `${API_BASE_URL}/api/resources/wallpapers`
      );
      return response.data;
    }
  } catch (error) {
    console.error("🔥 Error fetching resources:", error);
    throw error;
  }
};

// Function to fetch ambient sounds
export const fetchAudioResources = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    if (token) {
      // If admin token exists, fetch all ambient sounds (active and inactive)
      const response = await axios.get(
        `${API_BASE_URL}/api/resources/admin/ambient-sounds`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } else {
      // Fallback to public endpoint (active only)
      const response = await axios.get(
        `${API_BASE_URL}/api/resources/ambient-sounds`
      );
      return response.data;
    }
  } catch (error) {
    console.error("🔥 Error fetching ambient sounds:", error);
    throw error;
  }
};

export const loginAdmin = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/admin-login`, {
    email,
    password,
  });
  return response.data;
};

export const deleteResource = async (id: string, token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete resource: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("🔥 Error deleting resource:", error);
    throw error;
  }
};

export const toggleResourceStatus = async (id: string, token: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/resources/${id}/toggle-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to toggle resource status: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("🔥 Error toggling resource status:", error);
    throw error;
  }
};

export const uploadFile = async (
  file: File,
  category: string,
  tags: string,
  token: string | null
) => {
  if (!token) throw new Error("Unauthorized: No token provided!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  formData.append("tags", tags);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/resources/upload-wallpaper`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("🔥 Error uploading file:", error);
    throw error;
  }
};

// New function to upload ambient sounds
export const uploadAudio = async (
  file: File,
  name: string,
  tags: string,
  token: string | null
) => {
  if (!token) throw new Error("Unauthorized: No token provided!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  formData.append("tags", tags);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/resources/upload-audio`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("🔥 Error uploading audio:", error);
    throw error;
  }
};

// Other functions remain unchanged
export const updateUser = async (updatedData: any, token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/update-user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedData),
  });

  if (!response.ok) throw new Error("Failed to update user");
};

export const fetchUsers = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API fetchUsers error:", error);
    return { users: [] };
  }
};

// New function to update a user's role
export const updateUserRole = async (
  token: string,
  userId: string,
  role: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/users/${userId}/role`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          `Failed to update user role: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("🔥 Error updating user role:", error);
    throw error;
  }
};
export const uploadMusic = async (
  file: File,
  name: string,
  tags: string,
  token: string | null
) => {
  if (!token) throw new Error("Unauthorized: No token provided!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  if (tags) formData.append("tags", tags);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/resources/upload-music`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("🔥 Error uploading music:", error);
    throw error;
  }
};
// New function to fetch user statistics
export const fetchUserStats = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          `Failed to fetch user statistics: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("🔥 Error fetching user statistics:", error);
    // Return default values in case of error
    return { totalUsers: 0, activeUsers: 0, totalFocusTime: 0 };
  }
};

// New function to fetch project statistics
export const fetchProjectStats = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          `Failed to fetch project statistics: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("🔥 Error fetching project statistics:", error);
    // Return default values in case of error
    return { totalProjects: 0 };
  }
};
