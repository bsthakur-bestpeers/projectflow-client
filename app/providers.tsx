"use client";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { initializeAuth } from "@/store/authSlice";
import ToastContainer from "@/components/ui/ToastContainer";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(initializeAuth());
  }, []);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        {children}
        <ToastContainer />
      </AuthInitializer>
    </Provider>
  );
}
