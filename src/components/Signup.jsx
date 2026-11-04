import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Code2 } from "lucide-react";
import { signupSchema } from "../schemas/authSchema";
import { registerUser, clearError } from "../store/authSlice";

export default function Signup({ onSwitchToLogin }) {
  const dispatch = useDispatch();
  const { isLoading, error: reduxError } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      email: "",
      password: "",
    },
  });

  // Handle form submission via Redux dispatch
  const onSubmit = async (data) => {
    try {
      setServerError("");
      setSuccessMessage("");
      dispatch(clearError());

      const result = await dispatch(registerUser(data));

      if (registerUser.fulfilled.match(result)) {
        reset();
      } else {
        const errorMsg = result.payload || "Registration failed. Please try again.";
        setServerError(errorMsg);
      }
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    }
  };

  const displayError = serverError || reduxError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body p-6 sm:p-8">
          {/* Header & Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
              <Code2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
            <p className="text-sm text-base-content/70 mt-1">
              Join LeetCode Clone and start practicing coding problems
            </p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div role="alert" className="alert alert-success text-sm py-2 px-3 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {displayError && (
            <div role="alert" className="alert alert-error text-sm py-2 px-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Input 1: First Name */}
            <div className="form-control">
              <label className="label pb-1" htmlFor="firstName">
                <span className="label-text font-medium">First Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="firstName"
                  type="text"
                  placeholder="e.g. Alex"
                  autoComplete="given-name"
                  className={`input input-bordered w-full pl-9 ${errors.firstName ? "input-error" : ""}`}
                  {...register("firstName")}
                />
              </div>
              {errors.firstName && (
                <label className="label pt-1 pb-0">
                  <span className="label-text-alt text-error">{errors.firstName.message}</span>
                </label>
              )}
            </div>

            {/* Input 2: Email */}
            <div className="form-control">
              <label className="label pb-1" htmlFor="email">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  className={`input input-bordered w-full pl-9 ${errors.email ? "input-error" : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <label className="label pt-1 pb-0">
                  <span className="label-text-alt text-error">{errors.email.message}</span>
                </label>
              )}
            </div>

            {/* Input 3: Password */}
            <div className="form-control">
              <label className="label pb-1" htmlFor="password">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters (aA1@)"
                  autoComplete="new-password"
                  className={`input input-bordered w-full pl-9 pr-10 ${errors.password ? "input-error" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-base-content focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <label className="label pt-1 pb-0">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn btn-primary w-full mt-2"
            >
              {isSubmitting || isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="text-center text-xs text-base-content/60 mt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="link link-primary font-medium"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

