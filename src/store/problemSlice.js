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

