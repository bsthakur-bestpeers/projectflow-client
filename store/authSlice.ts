"use client";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,
};

export const initializeAuth = createAsyncThunk("auth/initialize", async () => {
  const response = await api.get("/auth/me");
  return response.data.data as User;
});

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }) => {
    const response = await api.post("/auth/login", credentials);
    return response.data.data.user as User;
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (data: { full_name: string; email: string; password: string }) => {
    await api.post("/auth/register", data);
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    updateProfileName(state, action: PayloadAction<string>) {
      if (state.user) {
        state.user.full_name = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Initialize
    builder.addCase(initializeAuth.pending, (state) => { state.isLoading = true; });
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.initialized = true;
    });
    builder.addCase(initializeAuth.rejected, (state) => {
      state.isLoading = false;
      state.initialized = true;
    });
    // Login
    builder.addCase(login.pending, (state) => { state.isLoading = true; });
    builder.addCase(login.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    });
    builder.addCase(login.rejected, (state) => { state.isLoading = false; });
    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { setUser, clearUser, updateProfileName } = authSlice.actions;
export default authSlice.reducer;
