

import axios from "axios";

// Central Axios instance for the backend.
export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5001/api",
});

// Attach JWT authentication to requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Extract user-friendly error messages.
export const message = (error) =>
  error.response?.data?.error ||
  error.message ||
  "Request failed";
