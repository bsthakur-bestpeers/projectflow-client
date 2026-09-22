import axios from "axios";

export interface ApiValidationError {
  field: string;
  message: string;
}

export interface ApiError extends Error {
  errors?: ApiValidationError[];
  status?: number;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor — extract data and detailed error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    let message = data?.message || "An unexpected error occurred.";

    // If backend returns validation errors array, prioritize the specific error messages
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const detailedMessages = data.errors
        .map((e: { message?: string; msg?: string }) => e.message || e.msg)
        .filter(Boolean);

      if (detailedMessages.length > 0) {
        message = detailedMessages.join(". ");
      }
    }

    const customError: ApiError = new Error(message);
    customError.errors = data?.errors;
    customError.status = error.response?.status;

    return Promise.reject(customError);
  }
);

export default api;
