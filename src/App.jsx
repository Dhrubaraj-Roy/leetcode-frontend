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
import {
  LogOut,
  User as UserIcon,
  Shield,
  Bot,
  Sparkles,
} from "lucide-react";

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

  // 3. Role-based routing rule
  useEffect(() => {
    if (!isCheckingAuth) {
      if (isAuthenticated) {
        if (user?.role === "admin") {
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#ffa116] border-t-transparent animate-spin"></div>
          <span className="text-xs text-gray-400">Loading LeetCode...</span>
        </div>
      </div>
    );
  }

  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#eff1f6] flex flex-col">
      {/* Top Real-World Production LeetCode Header */}
      {currentView !== "problem" && (
        <header className="h-[52px] bg-[#262626] border-b border-[#333333] px-4 sm:px-6 sticky top-0 z-50 flex items-center justify-between">
          {/* Brand & Left Navigation Tabs */}
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => navigate(isAdmin ? "admin" : "home")}
            >
              {/* Official LeetCode Chevron Icon */}
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="#FFA116">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0 1.38-1.382z"/>
              </svg>
              <span className="font-semibold text-base tracking-tight text-white">
                LeetCode
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => navigate("home")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  currentView === "home"
                    ? "text-white font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Problems
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate("admin")}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    currentView === "admin" || currentView === "problem/create"
                      ? "text-[#ffa116] font-semibold"
                      : "text-gray-400 hover:text-[#ffa116]"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Profile Pill */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1e1e1e] border border-[#333333] text-xs text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-[#ffa116] text-[#1a1a1a] font-bold flex items-center justify-center text-[11px]">
                    {(user.firstName || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium max-w-[120px] truncate">
                    {user.firstName || user.email}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold text-[#ffa116] bg-[#ffa116]/10 px-1.5 py-0.2 rounded">
                      Admin
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-md text-xs text-gray-400 hover:text-white hover:bg-[#333333] transition-colors flex items-center gap-1"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("login")}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-300 hover:text-white hover:bg-[#333333] transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate("signup")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a] transition-colors shadow-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main View Area */}
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
          <div className="min-h-[calc(100vh-52px)] flex items-center justify-center p-4">
            <Signup onSwitchToLogin={() => navigate("login")} />
          </div>
        ) : !isAuthenticated && currentView === "login" ? (
          <div className="min-h-[calc(100vh-52px)] flex items-center justify-center p-4">
            <Login onSwitchToSignup={() => navigate("signup")} />
          </div>
        ) : (
          <Home onSelectProblem={(id) => navigate("problem", id)} />
        )}
      </main>

      {/* Floating DSA Tutor Widget */}
      {currentView !== "problem" && (
        <div className="fixed bottom-5 right-5 z-50">
          {isChatOpen ? (
            <div className="w-[380px] sm:w-[420px] h-[520px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-6rem)] shadow-2xl rounded-xl border border-[#333333] overflow-hidden flex flex-col bg-[#262626]">
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#262626] hover:bg-[#333333] border border-[#3e3e3e] hover:border-[#ffa116]/60 text-white shadow-xl transition-all cursor-pointer group"
              title="Chat with DSA Tutor"
            >
              <Bot className="w-4 h-4 text-[#ffa116]" />
              <span className="text-xs font-semibold tracking-wide">
                DSA Tutor
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
