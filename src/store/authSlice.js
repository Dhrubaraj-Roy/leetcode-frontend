import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Base API URL (defaults to /api which proxies to backend in Vite dev)
const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * 1. Register User Thunk (POST /register)
 */
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/register`,
        {
          firstName: userData.firstName,
          emailId: userData.email,
          email: userData.email,
          password: userData.password,
        },
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Registration failed";
      return rejectWithValue(message);
    }
  }
);

/**
 * 2. Login User Thunk (POST /login)
 */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/login`,
        {
          emailId: credentials.email,
          password: credentials.password,
        },
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Invalid credentials";
      return rejectWithValue(message);
    }
  }
);

/**
 * 3. Check Authentication Thunk (GET /check)
 */
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/check`, {
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Not authenticated";
      return rejectWithValue(message);
    }
  }
);

/**
 * 4. Logout User Thunk (POST /logout)
 */
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/logout`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Logout failed";
      return rejectWithValue(message);
    }
  }
);

// Initial State
const initialState = {
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true, // true on initial app load while verifying existing cookie session
  isLoading: false,     // true only while submitting login / signup
  error: null,
};

// Auth Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register Cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login Cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // Check Authentication Cases
      .addCase(checkAuth.pending, (state) => {
        state.isCheckingAuth = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        if (action.payload?.authenticated && action.payload?.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isCheckingAuth = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })

      // Logout Cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

