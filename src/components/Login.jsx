import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { loginSchema } from "../schemas/authSchema";
import { loginUser, clearError } from "../store/authSlice";

export default function Login({ onSwitchToSignup }) {
  const navigate = useNavigate();
  const handleSwitchToSignup = onSwitchToSignup || (() => navigate("/signup"));

  const dispatch = useDispatch();
  const { isLoading, error: reduxError } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setServerError("");
      setSuccessMessage("");
      dispatch(clearError());

      const result = await dispatch(loginUser(data));

      if (loginUser.fulfilled.match(result)) {
        setSuccessMessage(result.payload?.message || "Sign in successful. Welcome back!");
        reset();
        navigate(result.payload?.user?.role === "admin" ? "/admin" : "/");
      } else {
        const errorMsg = result.payload || "Invalid credentials. Please verify your email and password.";
        setServerError(errorMsg);
      }
    } catch (err) {
      setServerError(err.message || "Invalid credentials. Please verify your details.");
    }
  };

  const displayError = serverError || reduxError;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-panel rounded-xl border border-border p-7 shadow-xl space-y-6">
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <svg className="w-10 h-10 mx-auto fill-brand" viewBox="0 0 24 24">
            <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
          </svg>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Sign in to LeetCode
          </h1>
          <p className="text-xs text-gray-400">
            Practice problems, build streaks, and prepare for interviews.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-easy text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {displayError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-hard text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs" noValidate>
          {/* Email */}
          <div className="space-y-1">
            <label className="text-gray-300 font-medium block" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className={`w-full h-9 pl-9 pr-3 bg-panel-subtle border rounded-md text-white placeholder:text-gray-500 focus:outline-none transition-colors ${
                  errors.email
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-border focus:border-brand"
                }`}
                {...register("email", {
                  onChange: () => {
                    if (displayError) {
                      setServerError("");
                      dispatch(clearError());
                    }
                  },
                })}
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-hard block">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-gray-300 font-medium block" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                className={`w-full h-9 pl-9 pr-9 bg-panel-subtle border rounded-md text-white placeholder:text-gray-500 focus:outline-none transition-colors ${
                  errors.password
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-border focus:border-brand"
                }`}
                {...register("password", {
                  onChange: () => {
                    if (displayError) {
                      setServerError("");
                      dispatch(clearError());
                    }
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-[11px] text-hard block">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full h-9 mt-2 rounded-md bg-brand hover:bg-brand-hover text-canvas font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isSubmitting || isLoading ? (
              <div className="w-3.5 h-3.5 rounded-full border border-black border-t-transparent animate-spin"></div>
            ) : null}
            <span>{isSubmitting || isLoading ? "Signing In..." : "Sign In"}</span>
          </button>
        </form>

        {/* Switch Link */}
        <div className="text-center text-xs text-gray-400 pt-1">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={handleSwitchToSignup}
            className="text-brand hover:underline font-semibold"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
