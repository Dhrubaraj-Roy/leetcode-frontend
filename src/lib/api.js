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

/**
 * Send message to chat endpoint (POST /chat)
 * Sends student message, previous history, problem context (title, description),
 * and student's current code from Monaco editor.
 */
export const sendChatMessageApi = async ({
  message,
  history = [],
  problemId = null,
  problemTitle = null,
  problemDescription = null,
  currentCode = null,
  language = null,
}) => {
  const response = await api.post("/chat", {
    message,
    history,
    problemId,
    problemTitle,
    problemDescription,
    currentCode,
    language,
  });
  return response.data;
};

/**
 * Step 1: Request a secure Cloudinary digital upload signature from backend (POST /video/create)
 */
export const getVideoUploadSignature = async ({ problemId }) => {
  const response = await api.post("/video/create", { problemId });
  return response.data;
};

/**
 * Step 4: Save uploaded video metadata to backend (POST /video/save)
 * Backend verifies problem existence and generates thumbnail on the go
 */
export const saveVideoMetadataApi = async ({
  problemId,
  videoUrl,
  publicId,
  thumbnailUrl,
  duration,
  format,
  bytes,
}) => {
  const response = await api.post("/video/save", {
    problemId,
    videoUrl,
    publicId,
    thumbnailUrl,
    duration,
    format,
    bytes,
  });
  return response.data;
};

/**
 * Delete a solution video by videoId or problemId (DELETE /video/delete/:id)
 * Destroys Cloudinary asset using destroy command and removes from database
 */
export const deleteVideoApi = async (id) => {
  const response = await api.delete(`/video/delete/${id}`);
  return response.data;
};

/**
 * Fetch solution video by Problem ID (GET /video/problem/:problemId)
 * One problem, one solution video
 */
export const fetchVideoByProblemId = async (problemId) => {
  const response = await api.get(`/video/problem/${problemId}`);
  return response.data;
};
