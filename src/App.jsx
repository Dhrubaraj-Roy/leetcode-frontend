import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Home from "./components/Home";
import Signup from "./components/Signup";
import Login from "./components/Login";
import AdminPanel from "./components/AdminPanel";
import CreateProblem from "./components/CreateProblem";
import ProblemDetail from "./components/ProblemDetail";
import ChatInterface from "./components/ChatInterface";
import { checkAuth, logoutUser } from "./store/authSlice";
import { Code2, LogOut, User as UserIcon, LayoutDashboard, Bot } from "lucide-react";

export default function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isCheckingAuth } = useSelector(
    (state) => state.auth
  );
  // Routes: "home" | "admin" | "problem/create" | "problem" | "signup" | "login"
  const [currentView, setCurrentView] = useState("home");
  const [activeProblemId, setActiveProblemId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const hasHandledInitialAuthRef = useRef(false);

  // Helper to change view and synchronize the browser URL pathname
  const navigate = (view, problemId = null) => {
    let path = "/";
    if (view === "problem/create") {
      path = "/problem/create";
    } else if (view === "admin") {
      path = "/admin";
    } else if (view === "login") {
      path = "/login";
    } else if (view === "signup") {
      path = "/signup";
    } else if (view === "problem" && problemId) {
      path = `/problem/${problemId}`;
    } else if (typeof view === "string" && view.startsWith("problem/")) {
      const extractedId = view.replace("problem/", "");
      path = `/${view}`;
      problemId = extractedId;
      view = "problem";
    }

    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setActiveProblemId(problemId);
    setCurrentView(view);
  };

  // 1. Sync route from URL on mount & browser back/forward buttons
  useEffect(() => {
    const syncRouteFromUrl = () => {
      const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, "");
      if (cleanPath === "problem/create") {
        setCurrentView("problem/create");
        setActiveProblemId(null);
      } else if (cleanPath === "admin") {
        setCurrentView("admin");
        setActiveProblemId(null);
      } else if (cleanPath === "login") {
        setCurrentView("login");
        setActiveProblemId(null);
      } else if (cleanPath === "signup") {
        setCurrentView("signup");
        setActiveProblemId(null);
      } else if (cleanPath.startsWith("problem/")) {
        const id = cleanPath.substring("problem/".length);
        if (id) {
          setActiveProblemId(id);
          setCurrentView("problem");
        } else {
          setCurrentView("home");
          setActiveProblemId(null);
        }
      } else {
        setCurrentView("home");
        setActiveProblemId(null);
      }
    };

    syncRouteFromUrl();
    window.addEventListener("popstate", syncRouteFromUrl);
    return () => window.removeEventListener("popstate", syncRouteFromUrl);
  }, []);

  // 2. Dispatch check authentication on mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // 3. Role-based routing rule:
  // If user is authenticated and role is admin -> go to admin panel initially or from login/signup.
  // Otherwise -> go to home page.
  useEffect(() => {
    if (!isCheckingAuth) {
      if (isAuthenticated) {
        if (user?.role === "admin") {
          // On initial auth check, if on "/" or home, route to admin panel
          // Also redirect to admin if logging in from login/signup
          if (
            !hasHandledInitialAuthRef.current &&
            (currentView === "home" || window.location.pathname === "/")
          ) {
            hasHandledInitialAuthRef.current = true;
            navigate("admin");
          } else if (currentView === "login" || currentView === "signup") {
            navigate("admin");
          }
        } else {
          // Normal user: prevent access to admin or problem/create -> redirect to home
          if (
            currentView === "admin" ||
            currentView === "problem/create" ||
            currentView === "login" ||
            currentView === "signup"
          ) {
            navigate("home");
          }
        }
      } else {
        // Not authenticated: cannot view admin or problem/create -> redirect to home
        if (currentView === "admin" || currentView === "problem/create") {
          navigate("home");
        }
      }
      hasHandledInitialAuthRef.current = true;
    }
  }, [isAuthenticated, user?.role, isCheckingAuth]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("home");
  };

  // Show loading spinner ONLY while checking existing auth session on startup
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      {/* Top Navbar - Shown across site except when in full-screen Problem Code Editor */}
      {currentView !== "problem" && (
        <header className="navbar bg-base-100 border-b border-base-300 px-4 sm:px-8 sticky top-0 z-50">
          <div
            className="flex-1 flex items-center gap-2 cursor-pointer select-none"
            onClick={() => navigate(isAdmin ? "admin" : "home")}
          >
            <Code2 className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">LeetCode Clone</span>
            {isAdmin && (
              <span className="badge badge-warning badge-sm font-bold ml-2">
                ADMIN
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <div className="join mr-2">
                    <button
                      type="button"
                      onClick={() => navigate("admin")}
                      className={`join-item btn btn-sm gap-1.5 ${
                        currentView === "admin" || currentView === "problem/create"
                          ? "btn-warning text-warning-content font-semibold"
                          : "btn-ghost"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Panel
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("home")}
                      className={`join-item btn btn-sm ${
                        currentView === "home" ? "btn-primary" : "btn-ghost"
                      }`}
                    >
                      Problems
                    </button>
                  </div>
                )}

                <span className="text-sm font-medium flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-base-content/70" />
                  {user.firstName || user.emailId || user.email}
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
                  onClick={() => navigate("home")}
                  className={`join-item btn btn-sm ${
                    currentView === "home" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  Problems
                </button>
                <button
                  type="button"
                  onClick={() => navigate("signup")}
                  className={`join-item btn btn-sm ${
                    currentView === "signup" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => navigate("login")}
                  className={`join-item btn btn-sm ${
                    currentView === "login" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full">
        {currentView === "problem" && activeProblemId ? (
          <ProblemDetail
            problemId={activeProblemId}
            onNavigateToHome={() => navigate("home")}
            onNavigateToLogin={() => navigate("login")}
          />
        ) : currentView === "problem/create" && isAdmin ? (
          <CreateProblem
            onNavigateToAdmin={() => navigate("admin")}
            onNavigateToHome={() => navigate("home")}
          />
        ) : currentView === "admin" && isAdmin ? (
          <AdminPanel
            onNavigateToHome={() => navigate("home")}
            onNavigateToCreateProblem={() => navigate("problem/create")}
            onSelectProblem={(id) => navigate("problem", id)}
          />
        ) : !isAuthenticated && currentView === "signup" ? (
          <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
            <Signup onSwitchToLogin={() => navigate("login")} />
          </div>
        ) : !isAuthenticated && currentView === "login" ? (
          <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
            <Login onSwitchToSignup={() => navigate("signup")} />
          </div>
        ) : (
          <Home onSelectProblem={(id) => navigate("problem", id)} />
        )}
      </main>

      {/* Floating DSA Teacher Chat Assistant Widget */}
      {currentView !== "problem" && (
        <div className="fixed bottom-5 right-5 z-50">
          {isChatOpen ? (
            <div className="w-[360px] sm:w-[400px] h-[520px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-6rem)] shadow-2xl rounded-2xl border border-base-300 overflow-hidden flex flex-col bg-base-100">
              <ChatInterface
                onClose={() => setIsChatOpen(false)}
                onNavigateToLogin={() => {
                  setIsChatOpen(false);
                  navigate("login");
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="btn btn-primary btn-circle shadow-xl h-14 w-14 hover:scale-105 transition-transform"
              title="Chat with DSA Teacher"
            >
              <Bot className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
