"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface UiState {
  toasts: Toast[];
}

const initialState: UiState = { toasts: [] };

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
  },
});

export const { addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
