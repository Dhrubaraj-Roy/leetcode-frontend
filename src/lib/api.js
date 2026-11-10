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
 * Fetch a single problem by ID (GET /problem/get/:id)
 */
export const fetchProblemById = async (id) => {
  const response = await api.get(`/problem/get/${id}`);
  return response.data?.problem || response.data;
};

/**
 * Run code against visible test cases (POST /problem/run/:problemId)
 */
export const runCodeApi = async ({ problemId, language, code }) => {
  const response = await api.post(`/problem/run/${problemId}`, {
    language,
    code,
  });
  return response.data;
};

/**
 * Submit code for evaluation against all test cases (POST /problem/solve/:problemId)
 */
export const submitCodeApi = async ({ problemId, language, code }) => {
  const response = await api.post(`/problem/solve/${problemId}`, {
    language,
    code,
  });
  return response.data;
};

/**
 * Fetch user submissions for a specific problem (GET /submit/:problemId)
 */
export const fetchProblemSubmissionsApi = async (problemId) => {
  const response = await api.get(`/submit/${problemId}`);
  return response.data;
};

/**
 * Fetch current user profile (GET /profile)
 */
export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};
