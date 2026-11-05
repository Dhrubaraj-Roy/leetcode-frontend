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
 * Check if the user is authenticated (GET /check)
 * Returns { authenticated: true, user: { id, firstName, emailId, role } }
 */
export const checkAuth = async () => {
  const response = await api.get("/check");
  return response.data;
};

/**
 * Fetch all problems (GET /problem/all)
 */
export const fetchAllProblems = async (params = {}) => {
  const response = await api.get("/problem/all", { params });
  return response.data;
};

/**
 * Fetch all solved problems for logged-in user (GET /problem/solved)
 */
export const fetchSolvedProblems = async () => {
  const response = await api.get("/problem/solved");
  return response.data;
};

/**
 * Fetch current user profile (GET /profile)
 */
export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};
