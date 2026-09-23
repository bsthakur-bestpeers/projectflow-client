"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface UiState {
  toasts: Toast[];
  sidebarOpen: boolean;
}

const initialState: UiState = { toasts: [], sidebarOpen: false };

let toastCounter = 0;

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<Omit<Toast, "id">>) {
      toastCounter += 1;
      state.toasts.push({
        ...action.payload,
        id: `${Date.now()}-${toastCounter}-${Math.random().toString(36).slice(2, 7)}`,
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
  },
});

export const { addToast, removeToast, toggleSidebar, setSidebarOpen, closeSidebar } = uiSlice.actions;
export default uiSlice.reducer;
