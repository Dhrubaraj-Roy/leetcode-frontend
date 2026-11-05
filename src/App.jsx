import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Home from "./components/Home";
import Signup from "./components/Signup";
import Login from "./components/Login";
import { checkAuth, logoutUser } from "./store/authSlice";
import { Code2, LogOut, User as UserIcon } from "lucide-react";

export default function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const [currentView, setCurrentView] = useState("home"); // "home" | "signup" | "login"

  // Dispatch check authentication on mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setCurrentView("login");
  };

  // Show loading spinner ONLY while checking existing auth session on startup
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      {/* Top Navbar */}
      <header className="navbar bg-base-100 border-b border-base-300 px-4 sm:px-8 sticky top-0 z-50">
        <div
          className="flex-1 flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setCurrentView("home")}
        >
          <Code2 className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">LeetCode Clone</span>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-base-content/70" />
                {user.firstName || user.emailId}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="join">
              <button
                type="button"
                onClick={() => setCurrentView("home")}
                className={`join-item btn btn-sm ${currentView === "home" ? "btn-primary" : "btn-ghost"}`}
              >
                Problems
              </button>
              <button
                type="button"
                onClick={() => setCurrentView("signup")}
                className={`join-item btn btn-sm ${currentView === "signup" ? "btn-primary" : "btn-ghost"}`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setCurrentView("login")}
                className={`join-item btn btn-sm ${currentView === "login" ? "btn-primary" : "btn-ghost"}`}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {isAuthenticated || currentView === "home" ? (
          <Home />
        ) : currentView === "signup" ? (
          <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
            <Signup onSwitchToLogin={() => setCurrentView("login")} />
          </div>
        ) : (
          <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
            <Login onSwitchToSignup={() => setCurrentView("signup")} />
          </div>
        )}
      </main>
    </div>
  );
}
