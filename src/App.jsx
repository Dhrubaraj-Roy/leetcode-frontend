import React, { useState } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import { logoutUser } from "./lib/api";
import { Code2, LogOut, User as UserIcon } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState("signup"); // "signup" | "login"
  const [user, setUser] = useState(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setCurrentView("login");
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      {/* Top Navbar */}
      <header className="navbar bg-base-100 border-b border-base-300 px-4 sm:px-8">
        <div className="flex-1 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">LeetCode Clone</span>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
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
      <main className="flex-1 flex items-center justify-center">
        {user ? (
          <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Hello, {user.firstName || "Coder"}!</h2>
            <p className="text-sm text-base-content/70 mt-1">{user.emailId}</p>
            <div className="badge badge-accent badge-outline mx-auto mt-3 capitalize">
              Role: {user.role || "user"}
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-error btn-outline btn-sm w-full"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : currentView === "signup" ? (
          <Signup onSwitchToLogin={() => setCurrentView("login")} />
        ) : (
          <Login
            onSwitchToSignup={() => setCurrentView("signup")}
            onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
          />
        )}
      </main>
    </div>
  );
}
