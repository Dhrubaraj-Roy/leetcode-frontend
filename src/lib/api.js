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
    // Pass through canceled requests silently
    if (
      axios.isCancel(error) ||
      error.name === "CanceledError" ||
      error.code === "ERR_CANCELED"
    ) {
      return Promise.reject(error);
    }

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
 * Supports AbortSignal in options (e.g. { signal })
 */
export const fetchProblemById = async (id, options = {}) => {
  const response = await api.get(`/problem/get/${id}`, options);
  return response.data?.problem || response.data;
};

/**
 * Run code against visible test cases (POST /problem/run/:problemId)
 */
export const runCodeApi = async ({ problemId, language, code }, options = {}) => {
  const response = await api.post(
    `/problem/run/${problemId}`,
    {
      language,
      code,
    },
    options
  );
  return response.data;
};

/**
 * Submit code for evaluation against all test cases (POST /problem/solve/:problemId)
 */
export const submitCodeApi = async ({ problemId, language, code }, options = {}) => {
  const response = await api.post(
    `/problem/solve/${problemId}`,
    {
      language,
      code,
    },
    options
  );
  return response.data;
};

/**
 * Fetch user submissions for a specific problem (GET /submit/:problemId)
 * Supports AbortSignal in options (e.g. { signal })
 */
export const fetchProblemSubmissionsApi = async (problemId, options = {}) => {
  const response = await api.get(`/submit/${problemId}`, options);
  return response.data;
};

/**
 * Fetch current user profile (GET /profile)
 */
export const getProfile = async (options = {}) => {
  const response = await api.get("/profile", options);
  return response.data;
};

/**
 * Send message to chat endpoint (POST /chat)
 */
export const sendChatMessageApi = async (
  {
    message,
    history = [],
    problemId = null,
    problemTitle = null,
    problemDescription = null,
    currentCode = null,
    language = null,
  },
  options = {}
) => {
  const response = await api.post(
    "/chat",
    {
      message,
      history,
      problemId,
      problemTitle,
      problemDescription,
      currentCode,
      language,
    },
    options
  );
  return response.data;
};

/**
 * Request a secure Cloudinary digital upload signature from backend (POST /video/create)
 */
export const getVideoUploadSignature = async ({ problemId }, options = {}) => {
  const response = await api.post("/video/create", { problemId }, options);
  return response.data;
};

/**
 * Save uploaded video metadata to backend (POST /video/save)
 */
export const saveVideoMetadataApi = async (
  {
    problemId,
    videoUrl,
    publicId,
    thumbnailUrl,
    duration,
    format,
    bytes,
  },
  options = {}
) => {
  const response = await api.post(
    "/video/save",
    {
      problemId,
      videoUrl,
      publicId,
      thumbnailUrl,
      duration,
      format,
      bytes,
    },
    options
  );
  return response.data;
};

/**
 * Delete a solution video by videoId or problemId (DELETE /video/delete/:id)
 */
export const deleteVideoApi = async (id, options = {}) => {
  const response = await api.delete(`/video/delete/${id}`, options);
  return response.data;
};

/**
 * Fetch solution video by Problem ID (GET /video/problem/:problemId)
 * Supports AbortSignal in options (e.g. { signal })
 */
export const fetchVideoByProblemId = async (problemId, options = {}) => {
  const response = await api.get(`/video/problem/${problemId}`, options);
  return response.data;
};
