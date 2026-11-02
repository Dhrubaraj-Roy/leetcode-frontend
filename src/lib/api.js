import axios from "axios";

// Axios instance with default configuration
// Uses Vite proxy `/api` in development or VITE_API_URL in production
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // Allows HTTP-only cookies to be sent and received
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Call backend registration endpoint (POST /register)
 * Sends firstName, emailId, and password
 */
export const registerUser = async ({ firstName, email, password }) => {
  const response = await api.post("/register", {
    firstName,
    emailId: email,
    email,
    password,
  });
  return response.data;
};

/**
 * Call backend login endpoint (POST /login)
 * Sends emailId and password
 */
export const loginUser = async ({ email, password }) => {
  const response = await api.post("/login", {
    emailId: email,
    password,
  });
  return response.data;
};

/**
 * Call backend logout endpoint (POST /logout)
 */
export const logoutUser = async () => {
  const response = await api.post("/logout");
  return response.data;
};

/**
 * Fetch current user profile (GET /profile)
 */
export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};
