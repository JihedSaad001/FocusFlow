import axios from "axios";

const API_BASE_URL = "https://focusflow-production.up.railway.app";
// Change to your backend URL
export const fetchResources = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/resources`);
    return response.data;
  } catch (error) {
    console.error("🔥 Error fetching resources:", error);
    throw error;
  }
};
export const loginAdmin = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/admin-login`, {
    email,
    password,
  });
  return response.data;
};
export const deleteResource = async (id: string, token: string) => {
  try {
    const response = await fetch(
      `https://focusflow-production.up.railway.app/api/resources/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete resource: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("🔥 Error deleting resource:", error);
    throw error;
  }
};
export const uploadFile = async (
  file: File,
  category: string,
  token: string | null
) => {
  if (!token) throw new Error("Unauthorized: No token provided!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/resources/upload`,
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
// src/api.ts
export const updateUser = async (updatedData: any, token: string) => {
  const response = await fetch(
    "https://focusflow-production.up.railway.app/api/auth/update-user",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    }
  );

  if (!response.ok) throw new Error("Failed to update user");
};

export const fetchUsers = async (token: string) => {
  try {
    const response = await fetch(
      "https://focusflow-production.up.railway.app/api/admin/users",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API fetchUsers error:", error);
    return { users: [] };
  }
};

export const deleteUser = async (token: string, userId: string) => {
  const response = await fetch(
    `https://focusflow-production.up.railway.app/api/admin/delete-user/${userId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete user");
  }
};
