import axios from "axios";

/**
 * Unified Axios instance with standard configuration.
 * Automatically handles baseURL, cookies, and 10-second timeout.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // Allows HTTP-only cookies to be sent and received
  timeout: 10000, // 10-second timeout to prevent infinite hanging spinners
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: Normalizes timeout errors and formats error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      error.message =
        "The request took too long and timed out. Please check your network connection and retry.";
    }

    // Standardized user-facing error message
    error.userMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected network error occurred.";

    return Promise.reject(error);
  }
);

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
 * Request a secure Cloudinary digital upload signature from backend (POST /video/create)
 */
export const getVideoUploadSignature = async ({ problemId }) => {
  const response = await api.post("/video/create", { problemId });
  return response.data;
};

/**
 * Save uploaded video metadata to backend (POST /video/save)
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
 */
export const deleteVideoApi = async (id) => {
  const response = await api.delete(`/video/delete/${id}`);
  return response.data;
};

/**
 * Fetch solution video by Problem ID (GET /video/problem/:problemId)
 */
export const fetchVideoByProblemId = async (problemId) => {
  const response = await api.get(`/video/problem/${problemId}`);
  return response.data;
};
