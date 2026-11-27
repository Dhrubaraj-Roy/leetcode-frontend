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
 * Fetch current status of a queued/evaluated submission (GET /problem/solve/status/:submissionId)
 */
export const fetchSubmissionStatusApi = async (submissionId, options = {}) => {
  const response = await api.get(`/problem/solve/status/${submissionId}`, options);
  return response.data;
};

/**
 * Waits for a queued submission's final verdict using Server-Sent Events (SSE)
 * with automatic fallback to status polling if the stream drops or fails.
 */
export const waitForSubmissionResultApi = (
  submissionId,
  { signal, timeoutMs = 45000, pollIntervalMs = 1000 } = {}
) => {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException("Aborted", "AbortError"));
    }

    let settled = false;
    let eventSource = null;
    let pollTimer = null;
    let overallTimer = null;

    const cleanup = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
      if (overallTimer) {
        clearTimeout(overallTimer);
        overallTimer = null;
      }
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const onAbort = () => {
      fail(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    overallTimer = setTimeout(() => {
      fail(
        new Error(
          "Evaluation is taking longer than expected. Check the Submissions tab shortly for the final verdict."
        )
      );
    }, timeoutMs);

    const startPolling = () => {
      if (settled || signal?.aborted) return;

      const poll = async () => {
        if (settled || signal?.aborted) return;
        try {
          const data = await fetchSubmissionStatusApi(submissionId, { signal });
          const sub = data?.submission || data;
          const status = sub?.status || data?.status;

          if (status && status !== "Pending" && status !== "Queued") {
            finish(sub);
            return;
          }
        } catch (err) {
          if (
            signal?.aborted ||
            err.name === "CanceledError" ||
            err.code === "ERR_CANCELED"
          ) {
            fail(err);
            return;
          }
          // Transient polling error: retry until timeout unless unauthorized/not found
          const httpStatus = err.response?.status;
          if (httpStatus === 401 || httpStatus === 403 || httpStatus === 404) {
            fail(err);
            return;
          }
        }

        if (!settled && !signal?.aborted) {
          pollTimer = setTimeout(poll, pollIntervalMs);
        }
      };

      poll();
    };

    if (typeof EventSource === "undefined") {
      startPolling();
      return;
    }

    const apiBase = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
    const streamUrl = `${apiBase}/problem/solve/events/${submissionId}`;

    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onmessage = (event) => {
        if (settled) return;
        try {
          const payload = JSON.parse(event.data);
          const sub = payload?.submission || payload;
          const status = sub?.status || payload?.status;

          if (status && status !== "Pending" && status !== "Queued") {
            finish(sub);
          }
        } catch (_) {
          // Ignore malformed keep-alive/event payloads
        }
      };

      eventSource.onerror = () => {
        if (settled) return;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startPolling();
      };
    } catch (_) {
      startPolling();
    }
  });
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
