import React, { useState, useEffect, Suspense, lazy } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "sonner";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Home from "./components/Home";
import NotFound from "./components/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { checkAuth, logoutUser } from "./store/authSlice";
import {
  LogOut,
  Shield,
  Bot,
} from "lucide-react";

// Code-split heavy routes and components so Monaco Editor & Admin tools only download on demand
const ProblemDetail = lazy(() => import("./components/ProblemDetail"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const CreateProblem = lazy(() => import("./components/CreateProblem"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const ChatInterface = lazy(() => import("./components/ChatInterface"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-52px)] bg-canvas flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>
        <span className="text-xs text-gray-400">Loading view...</span>
      </div>
    </div>
  );
}

/**
 * Route guard: Requires authenticated admin.
 * Redirects unauthenticated users to /login and non-admin users to /.
 */
function AdminRoute({ children }) {
  const { user, isAuthenticated, isCheckingAuth } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();

  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Route guard: Guests only.
 * Redirects logged-in users away from /login and /signup.
 */
function GuestRoute({ children }) {
  const { user, isAuthenticated, isCheckingAuth } = useSelector(
    (state) => state.auth
  );

  if (isCheckingAuth) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/"} replace />;
  }

  return children;
}

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, isCheckingAuth } = useSelector(
    (state) => state.auth
  );

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Dispatch authentication check on mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>
          <span className="text-xs text-gray-400">Loading AlgoMentor...</span>
        </div>
      </div>
    );
  }

  const isAdmin = isAuthenticated && user?.role === "admin";
  const isProblemDetail =
    location.pathname.startsWith("/problem/") &&
    location.pathname !== "/problem/create";

  return (
    <div className="min-h-screen bg-canvas text-primary flex flex-col">
      {/* Top Header — shown on all views except individual problem workbench */}
      {!isProblemDetail && (
        <header className="h-[52px] bg-panel border-b border-border px-4 sm:px-6 sticky top-0 z-50 flex items-center justify-between">
          {/* Brand & Left Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to={isAdmin ? "/admin" : "/"}
              className="flex items-center gap-2 select-none"
            >
              {/* AlgoMentor Brand Icon */}
              <svg
                className="w-6 h-6 shrink-0 fill-brand"
                viewBox="0 0 24 24"
              >
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0 1.38-1.382z" />
              </svg>
              <span className="font-semibold text-base tracking-tight text-white">
                AlgoMentor
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  location.pathname === "/"
                    ? "text-white font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Problems
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    location.pathname === "/admin" ||
                    location.pathname === "/problem/create"
                      ? "text-brand font-semibold"
                      : "text-gray-400 hover:text-brand"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Profile Pill */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-panel-subtle border border-border text-xs text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-brand text-canvas font-bold flex items-center justify-center text-[11px]">
                    {(user.firstName || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium max-w-[120px] truncate">
                    {user.firstName || user.email}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.2 rounded">
                      Admin
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-md text-xs text-gray-400 hover:text-white hover:bg-panel-hover transition-colors flex items-center gap-1 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-300 hover:text-white hover:bg-panel-hover transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand hover:bg-brand-hover text-canvas transition-colors shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Routed Area */}
      <main className="flex-1 w-full">
        <ErrorBoundary
          title="Failed to load page"
          message="An error occurred while loading this view. You can retry below or return to problems."
        >
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/problem/:id" element={<ProblemDetail />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
              <Route
                path="/problem/create"
                element={
                  <AdminRoute>
                    <CreateProblem />
                  </AdminRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center p-4">
                      <Login />
                    </div>
                  </GuestRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <GuestRoute>
                    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center p-4">
                      <Signup />
                    </div>
                  </GuestRoute>
                }
              />
              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Floating DSA Tutor Widget */}
      {!isProblemDetail && (
        <div className="fixed bottom-5 right-5 z-50">
          {isChatOpen ? (
            <div className="w-[380px] sm:w-[420px] h-[520px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-6rem)] shadow-2xl rounded-xl border border-border overflow-hidden flex flex-col bg-panel">
              <Suspense
                fallback={
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-panel text-xs text-gray-400">
                    <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>
                    <span>Loading tutor...</span>
                  </div>
                }
              >
                <ChatInterface
                  onClose={() => setIsChatOpen(false)}
                  onNavigateToLogin={() => {
                    setIsChatOpen(false);
                    navigate("/login");
                  }}
                />
              </Suspense>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-panel hover:bg-panel-hover border border-border-subtle hover:border-brand/60 text-white shadow-xl transition-all cursor-pointer group"
              title="Chat with DSA Tutor"
            >
              <Bot className="w-4 h-4 text-brand" />
              <span className="text-xs font-semibold tracking-wide">
                DSA Tutor
              </span>
            </button>
          )}
        </div>
      )}

      {/* Accessible Non-Blocking Toast Container */}
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </div>
  );
}
