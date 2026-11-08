import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * 1. Fetch All Problems Thunk (GET /problem/all)
 * Accepts optional query params: { difficulty, tag, page, limit }
 */
export const getAllProblems = createAsyncThunk(
  "problems/getAllProblems",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/problem/all`, {
        params: {
          limit: 100, // Fetch up to 100 problems for smooth client-side filtering
          ...params,
        },
        withCredentials: true,
      });
      // response.data has { totalProblems, count, problems, totalPages, page }
      return response.data.problems || [];
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to fetch problems";
      return rejectWithValue(message);
    }
  }
);

/**
 * 2. Fetch Solved Problems Thunk (GET /problem/solved)
 * Requires authenticated user session (HTTP-only cookie)
 */
export const getSolvedProblems = createAsyncThunk(
  "problems/getSolvedProblems",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/problem/solved`, {
        withCredentials: true,
      });
      // response.data has { count, solvedProblems }
      return response.data.solvedProblems || [];
    } catch (err) {
      // If 401 unauthenticated, return empty array without error
      if (err.response?.status === 401) {
        return [];
      }
      const message =
        err.response?.data?.message || err.message || "Failed to fetch solved problems";
      return rejectWithValue(message);
    }
  }
);

/**
 * 3. Delete Problem Thunk (DELETE /problem/delete/:id)
 * Admin only
 */
export const deleteProblem = createAsyncThunk(
  "problems/deleteProblem",
  async (problemId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_URL}/problem/delete/${problemId}`,
        { withCredentials: true }
      );
      return { id: problemId, message: response.data.message };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to delete problem";
      return rejectWithValue(message);
    }
  }
);

/**
 * 4. Create Problem Thunk (POST /problem/create)
 * Admin only
 */
export const createProblem = createAsyncThunk(
  "problems/createProblem",
  async (problemData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/problem/create`,
        problemData,
        { withCredentials: true }
      );
      return response.data.problem;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to create problem";
      return rejectWithValue(message);
    }
  }
);

/**
 * 5. Update Problem Thunk (PUT /problem/update/:id)
 * Admin only
 */
export const updateProblem = createAsyncThunk(
  "problems/updateProblem",
  async ({ id, problemData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/problem/update/${id}`,
        problemData,
        { withCredentials: true }
      );
      return response.data.problem;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.["here is the error"] ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update problem";
      return rejectWithValue(message);
    }
  }
);

// Initial State
const initialState = {
  problems: [],
  solvedProblems: [], // array of solved problem objects
  isLoading: false,
  error: null,
  filters: {
    status: "all",       // "all" | "solved"
    difficulty: "all",   // "all" | "easy" | "medium" | "hard"
    tag: "all",          // "all" | string
    search: "",          // search query string
  },
};

const problemSlice = createSlice({
  name: "problems",
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },
    setDifficultyFilter: (state, action) => {
      state.filters.difficulty = action.payload;
    },
    setTagFilter: (state, action) => {
      state.filters.tag = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.filters.search = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        status: "all",
        difficulty: "all",
        tag: "all",
        search: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // All Problems Cases
      .addCase(getAllProblems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllProblems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.problems = action.payload;
        state.error = null;
      })
      .addCase(getAllProblems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Solved Problems Cases
      .addCase(getSolvedProblems.fulfilled, (state, action) => {
        state.solvedProblems = action.payload;
      })
      .addCase(getSolvedProblems.rejected, (state) => {
        state.solvedProblems = [];
      })

      // Delete Problem Cases
      .addCase(deleteProblem.fulfilled, (state, action) => {
        state.problems = state.problems.filter(
          (p) => p._id !== action.payload.id
        );
      })

      // Create Problem Cases
      .addCase(createProblem.fulfilled, (state, action) => {
        if (action.payload) {
          state.problems.unshift(action.payload);
        }
      })

      // Update Problem Cases
      .addCase(updateProblem.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.problems.findIndex(
            (p) => p._id === action.payload._id
          );
          if (index !== -1) {
            state.problems[index] = action.payload;
          }
        }
      });
  },
});

export const {
  setStatusFilter,
  setDifficultyFilter,
  setTagFilter,
  setSearchQuery,
  resetFilters,
} = problemSlice.actions;

export default problemSlice.reducer;

