import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createProblem } from "../store/problemSlice";
import { createProblemSchema } from "../schemas/problemSchema";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCode,
  X,
} from "lucide-react";

export default function CreateProblem({ onNavigateToAdmin, onNavigateToHome }) {
  const navigate = useNavigate();
  const handleGoAdmin = onNavigateToAdmin || (() => navigate("/admin"));
  const handleGoHome = onNavigateToHome || (() => navigate("/"));

  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Form management via react-hook-form & Zod validation
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createProblemSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "easy",
      tags: "",
      visibleTestCases: [
        { input: "", output: "", explanation: "" },
        { input: "", output: "", explanation: "" },
      ],
      hiddenTestCases: [
        { input: "", output: "" },
        { input: "", output: "" },
      ],
      pythonRefCode: "",
      pythonStartCode: "",
      cppRefCode: "",
      cppStartCode: "",
    },
    mode: "onTouched",
  });

  // Dynamic field arrays for test cases
  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({
    control,
    name: "visibleTestCases",
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({
    control,
    name: "hiddenTestCases",
  });

  // Language tab state
  const [activeLangTab, setActiveLangTab] = useState("python");
  const pythonRefCodeValue = watch("pythonRefCode");
  const cppRefCodeValue = watch("cppRefCode");

  // JSON Import Modal state
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState(null);

  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Security Guard: Admin only
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-panel rounded-xl border border-border text-center space-y-4">
        <div className="w-12 h-12 bg-rose-500/10 text-hard rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Access Denied</h2>
          <p className="text-xs text-gray-400 mt-1">
            You must be signed in with an admin account to create problems.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGoHome}
          className="px-4 py-2 rounded-md bg-brand text-canvas text-xs font-semibold hover:bg-brand-hover transition-colors"
        >
          Return to Problems
        </button>
      </div>
    );
  }

  // Quick Import JSON
  const handleApplyJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput.trim());

      let tagsStr = "";
      if (Array.isArray(parsed.tags)) {
        tagsStr = parsed.tags.join(", ");
      } else if (typeof parsed.tags === "string") {
        tagsStr = parsed.tags;
      }

      let visCases = [];
      if (Array.isArray(parsed.visibleTestCases) && parsed.visibleTestCases.length > 0) {
        visCases = parsed.visibleTestCases.map((tc) => ({
          input: tc.input || "",
          output: tc.output || "",
          explanation: tc.explanation || "",
        }));
      } else {
        visCases = [
          { input: "", output: "", explanation: "" },
          { input: "", output: "", explanation: "" },
        ];
      }

      let hidCases = [];
      if (Array.isArray(parsed.hiddenTestCases) && parsed.hiddenTestCases.length > 0) {
        hidCases = parsed.hiddenTestCases.map((tc) => ({
          input: tc.input || "",
          output: tc.output || "",
        }));
      } else {
        hidCases = [
          { input: "", output: "" },
          { input: "", output: "" },
        ];
      }

      let pyRef = "";
      let pyStart = "";
      let cppRef = "";
      let cppStart = "";

      if (Array.isArray(parsed.referenceSolution)) {
        parsed.referenceSolution.forEach((sol) => {
          const lang = sol.language?.toLowerCase();
          if (lang === "python") pyRef = sol.completeCode || "";
          if (lang === "cpp" || lang === "c++") cppRef = sol.completeCode || "";
        });
      }

      if (Array.isArray(parsed.startCode)) {
        parsed.startCode.forEach((sc) => {
          const lang = sc.language?.toLowerCase();
          if (lang === "python") pyStart = sc.initialCode || "";
          if (lang === "cpp" || lang === "c++") cppStart = sc.initialCode || "";
        });
      }

      reset({
        title: parsed.title || "",
        description: parsed.description || "",
        difficulty: parsed.difficulty?.toLowerCase() || "easy",
        tags: tagsStr,
        visibleTestCases: visCases,
        hiddenTestCases: hidCases,
        pythonRefCode: pyRef,
        pythonStartCode: pyStart,
        cppRefCode: cppRef,
        cppStartCode: cppStart,
      });

      setIsJsonModalOpen(false);
      setJsonInput("");
      toast.success("Problem JSON imported successfully!");
    } catch (err) {
      setJsonError("Invalid JSON: " + err.message);
    }
  };

  const onSubmit = async (data) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const tagsArray = (data.tags || "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const validVisibleCases = data.visibleTestCases.map((tc) => ({
      input: tc.input.trim(),
      output: tc.output.trim(),
      explanation: tc.explanation?.trim() || "Example test case",
    }));

    const validHiddenCases = data.hiddenTestCases.map((tc) => ({
      input: tc.input.trim(),
      output: tc.output.trim(),
    }));

    const referenceSolution = [];
    const startCode = [];

    if (data.pythonRefCode?.trim()) {
      referenceSolution.push({
        language: "python",
        completeCode: data.pythonRefCode,
      });
      startCode.push({
        language: "python",
        initialCode: data.pythonStartCode?.trim() || data.pythonRefCode,
      });
    }

    if (data.cppRefCode?.trim()) {
      referenceSolution.push({
        language: "cpp",
        completeCode: data.cppRefCode,
      });
      startCode.push({
        language: "cpp",
        initialCode: data.cppStartCode?.trim() || data.cppRefCode,
      });
    }

    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      difficulty: data.difficulty.toLowerCase().trim(),
      tags: tagsArray,
      visibleTestCases: validVisibleCases,
      hiddenTestCases: validHiddenCases,
      referenceSolution,
      startCode,
    };

    const result = await dispatch(createProblem(payload));

    if (createProblem.fulfilled.match(result)) {
      const msg = "Problem created and verified successfully!";
      setSuccessMessage(msg);
      toast.success(msg);
      handleGoAdmin();
    } else {
      const errMsg =
        typeof result.payload === "string"
          ? result.payload
          : "Failed to create problem. Verify reference solution passes all test cases.";
      setErrorMessage(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <button
          type="button"
          onClick={handleGoAdmin}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Admin Panel</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setJsonError(null);
            setIsJsonModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-subtle bg-panel-subtle hover:bg-panel-elevated text-gray-300 text-xs transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-brand" />
          <span>Import JSON</span>
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Create New Problem
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Add problem description, 2 visible examples, 2 hidden test cases, and reference solution.
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-easy text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-hard text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-panel p-6 sm:p-7 rounded-xl border border-border space-y-6 text-xs"
      >
        {/* Title and Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-gray-300 font-medium">Problem Title *</label>
            <input
              type="text"
              placeholder="e.g. Valid Parentheses"
              {...register("title")}
              className={`w-full h-8 px-3 bg-panel-subtle border rounded text-white focus:outline-none transition-colors ${
                errors.title
                  ? "border-rose-500 focus:border-rose-500"
                  : "border-border focus:border-brand"
              }`}
            />
            {errors.title && (
              <p className="text-[11px] text-hard flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 font-medium">Difficulty *</label>
            <select
              {...register("difficulty")}
              className={`w-full h-8 px-2 bg-panel-subtle border rounded text-white focus:outline-none capitalize cursor-pointer transition-colors ${
                errors.difficulty
                  ? "border-rose-500 focus:border-rose-500"
                  : "border-border focus:border-brand"
              }`}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {errors.difficulty && (
              <p className="text-[11px] text-hard flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.difficulty.message}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-gray-300 font-medium">Description & Constraints *</label>
          <textarea
            rows={5}
            placeholder="Problem description, input/output specifications, constraints..."
            {...register("description")}
            className={`w-full p-3 bg-panel-subtle border rounded text-white leading-relaxed focus:outline-none transition-colors ${
              errors.description
                ? "border-rose-500 focus:border-rose-500"
                : "border-border focus:border-brand"
            }`}
          ></textarea>
          {errors.description && (
            <p className="text-[11px] text-hard flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <label className="text-gray-300 font-medium">Topic Tags (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g. stack, string, hash-table"
            {...register("tags")}
            className="w-full h-8 px-3 bg-panel-subtle border border-border rounded text-white focus:outline-none focus:border-brand"
          />
        </div>

        {/* ----------------- SECTION 1: VISIBLE TEST CASES ----------------- */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">
                Visible Test Cases ({visibleFields.length})
              </span>
              <span className="text-[11px] text-gray-400 ml-2">
                (2 required)
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                appendVisible({ input: "", output: "", explanation: "" })
              }
              className="px-2.5 py-1 rounded bg-panel-subtle hover:bg-panel-hover border border-border-subtle text-gray-200 text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-brand" />
              <span>Add Visible Case</span>
            </button>
          </div>

          {errors.visibleTestCases?.message && (
            <p className="text-[11px] text-hard flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.visibleTestCases.message}
            </p>
          )}
          {errors.visibleTestCases?.root?.message && (
            <p className="text-[11px] text-hard flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.visibleTestCases.root.message}
            </p>
          )}

          <div className="space-y-3">
            {visibleFields.map((field, index) => {
              const inputError = errors.visibleTestCases?.[index]?.input;
              const outputError = errors.visibleTestCases?.[index]?.output;

              return (
                <div
                  key={field.id}
                  className="border border-border rounded-lg p-3.5 bg-panel-subtle space-y-2.5"
                >
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="font-medium text-white">Visible Case #{index + 1}</span>
                    {visibleFields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeVisible(index)}
                        className="text-hard hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px]">Input *</label>
                      <textarea
                        rows={2}
                        placeholder="Input..."
                        {...register(`visibleTestCases.${index}.input`)}
                        className={`w-full p-2 bg-panel border rounded font-mono text-xs text-white focus:outline-none transition-colors ${
                          inputError
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-border focus:border-brand"
                        }`}
                      ></textarea>
                      {inputError && (
                        <p className="text-[11px] text-hard flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {inputError.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px]">Expected Output *</label>
                      <textarea
                        rows={2}
                        placeholder="Output..."
                        {...register(`visibleTestCases.${index}.output`)}
                        className={`w-full p-2 bg-panel border rounded font-mono text-xs text-easy focus:outline-none transition-colors ${
                          outputError
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-border focus:border-brand"
                        }`}
                      ></textarea>
                      {outputError && (
                        <p className="text-[11px] text-hard flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {outputError.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 text-[11px]">Explanation (Optional)</label>
                    <input
                      type="text"
                      placeholder="Why this output is expected..."
                      {...register(`visibleTestCases.${index}.explanation`)}
                      className="w-full h-7 px-2.5 bg-panel border border-border rounded text-xs text-white focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ----------------- SECTION 2: HIDDEN TEST CASES ----------------- */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">
                Hidden Test Cases ({hiddenFields.length})
              </span>
              <span className="text-[11px] text-gray-400 ml-2">
                (2 required)
              </span>
            </div>

            <button
              type="button"
              onClick={() => appendHidden({ input: "", output: "" })}
              className="px-2.5 py-1 rounded bg-panel-subtle hover:bg-panel-hover border border-border-subtle text-gray-200 text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-brand" />
              <span>Add Hidden Case</span>
            </button>
          </div>

          {errors.hiddenTestCases?.message && (
            <p className="text-[11px] text-hard flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.hiddenTestCases.message}
            </p>
          )}
          {errors.hiddenTestCases?.root?.message && (
            <p className="text-[11px] text-hard flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.hiddenTestCases.root.message}
            </p>
          )}

          <div className="space-y-3">
            {hiddenFields.map((field, index) => {
              const inputError = errors.hiddenTestCases?.[index]?.input;
              const outputError = errors.hiddenTestCases?.[index]?.output;

              return (
                <div
                  key={field.id}
                  className="border border-border rounded-lg p-3.5 bg-panel-subtle space-y-2.5"
                >
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="font-medium text-white">Hidden Case #{index + 1}</span>
                    {hiddenFields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeHidden(index)}
                        className="text-hard hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px]">Hidden Input *</label>
                      <textarea
                        rows={2}
                        placeholder="Input..."
                        {...register(`hiddenTestCases.${index}.input`)}
                        className={`w-full p-2 bg-panel border rounded font-mono text-xs text-white focus:outline-none transition-colors ${
                          inputError
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-border focus:border-brand"
                        }`}
                      ></textarea>
                      {inputError && (
                        <p className="text-[11px] text-hard flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {inputError.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px]">Hidden Expected Output *</label>
                      <textarea
                        rows={2}
                        placeholder="Output..."
                        {...register(`hiddenTestCases.${index}.output`)}
                        className={`w-full p-2 bg-panel border rounded font-mono text-xs text-easy focus:outline-none transition-colors ${
                          outputError
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-border focus:border-brand"
                        }`}
                      ></textarea>
                      {outputError && (
                        <p className="text-[11px] text-hard flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {outputError.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ----------------- SECTION 3: CODE IMPLEMENTATIONS ----------------- */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div>
            <span className="font-semibold text-white">Code Templates</span>
            <p className="text-[11px] text-gray-400">
              Provide complete reference code that solves the problem.
            </p>
          </div>

          {errors.pythonRefCode && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/25 text-hard text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.pythonRefCode.message}</span>
            </div>
          )}

          {/* Language Toggle */}
          <div className="flex items-center bg-panel-subtle p-0.5 rounded-lg border border-border text-xs w-fit">
            <button
              type="button"
              onClick={() => setActiveLangTab("python")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeLangTab === "python"
                  ? "bg-panel-elevated text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Python
              {pythonRefCodeValue?.trim() && (
                <span className="w-1.5 h-1.5 rounded-full bg-easy inline-block ml-1.5"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveLangTab("cpp")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeLangTab === "cpp"
                  ? "bg-panel-elevated text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              C++
              {cppRefCodeValue?.trim() && (
                <span className="w-1.5 h-1.5 rounded-full bg-easy inline-block ml-1.5"></span>
              )}
            </button>
          </div>

          {/* Python Config */}
          {activeLangTab === "python" && (
            <div className="space-y-3 bg-panel-subtle p-4 rounded-lg border border-border">
              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  Python Complete Reference Solution *
                </label>
                <textarea
                  rows={8}
                  placeholder="Complete reference code..."
                  {...register("pythonRefCode")}
                  className="w-full p-2.5 bg-canvas-subtle border border-border-muted rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-brand"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  Python Starter Code (Shown to users)
                </label>
                <textarea
                  rows={5}
                  placeholder="Starter template code..."
                  {...register("pythonStartCode")}
                  className="w-full p-2.5 bg-canvas-subtle border border-border-muted rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-brand"
                ></textarea>
              </div>
            </div>
          )}

          {/* C++ Config */}
          {activeLangTab === "cpp" && (
            <div className="space-y-3 bg-panel-subtle p-4 rounded-lg border border-border">
              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  C++ Complete Reference Solution *
                </label>
                <textarea
                  rows={8}
                  placeholder="#include <iostream>&#10;using namespace std;&#10;..."
                  {...register("cppRefCode")}
                  className="w-full p-2.5 bg-canvas-subtle border border-border-muted rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-brand"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  C++ Starter Code (Shown to users)
                </label>
                <textarea
                  rows={5}
                  placeholder="#include <iostream>&#10;..."
                  {...register("cppStartCode")}
                  className="w-full p-2.5 bg-canvas-subtle border border-border-muted rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-brand"
                ></textarea>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleGoAdmin}
            className="px-4 py-2 rounded-md border border-border bg-panel-subtle hover:bg-panel-hover text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-md bg-brand hover:bg-brand-hover text-canvas font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-3.5 h-3.5 rounded-full border border-black border-t-transparent animate-spin"></div>
            ) : null}
            <span>{isSubmitting ? "Creating..." : "Create Problem"}</span>
          </button>
        </div>
      </form>

      {/* JSON Import Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-panel rounded-xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-xs">
            <div className="p-4 border-b border-border flex items-center justify-between bg-panel-header">
              <span className="font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-brand" />
                Import Problem JSON
              </span>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <p className="text-gray-400 text-xs">
                Paste JSON containing fields like title, description, visibleTestCases, hiddenTestCases, and referenceSolution.
              </p>

              {jsonError && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/25 text-hard">
                  {jsonError}
                </div>
              )}

              <textarea
                rows={12}
                placeholder={`{\n  "title": "Two Sum",\n  "difficulty": "easy",\n  "description": "...",\n  "visibleTestCases": [...]\n}`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-3 bg-panel-subtle border border-border rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-brand"
              ></textarea>
            </div>

            <div className="p-3.5 border-t border-border flex items-center justify-end gap-2 bg-panel-header">
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="px-3 py-1.5 rounded border border-border bg-panel-subtle hover:bg-panel-hover text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyJson}
                disabled={!jsonInput.trim()}
                className="px-4 py-1.5 rounded bg-brand text-canvas font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40"
              >
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
