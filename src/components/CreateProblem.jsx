import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProblem } from "../store/problemSlice";
import {
  ChevronLeft,
  Code2,
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

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    tags: "",
    visibleTestCases: [
      { input: "", output: "", explanation: "" },
    ],
    hiddenTestCases: [
      { input: "", output: "" },
    ],
    pythonRefCode: "",
    pythonStartCode: "",
    cppRefCode: "",
    cppStartCode: "",
  });

  const [activeLangTab, setActiveLangTab] = useState("python");

  // JSON Modal
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Security Guard: Admin only
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#262626] rounded-xl border border-[#333333] text-center space-y-4">
        <div className="w-12 h-12 bg-rose-500/10 text-[#ff375f] rounded-full flex items-center justify-center mx-auto">
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
          className="px-4 py-2 rounded-md bg-[#ffa116] text-[#1a1a1a] text-xs font-semibold hover:bg-[#e68a00] transition-colors"
        >
          Return to Problems
        </button>
      </div>
    );
  }

  // Visible Test Cases Handlers
  const handleVisibleChange = (index, field, value) => {
    const updated = [...formData.visibleTestCases];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, visibleTestCases: updated });
  };

  const addVisibleTestCase = () => {
    setFormData({
      ...formData,
      visibleTestCases: [
        ...formData.visibleTestCases,
        { input: "", output: "", explanation: "" },
      ],
    });
  };

  const removeVisibleTestCase = (index) => {
    if (formData.visibleTestCases.length <= 1) return;
    const updated = formData.visibleTestCases.filter((_, i) => i !== index);
    setFormData({ ...formData, visibleTestCases: updated });
  };

  // Hidden Test Cases Handlers
  const handleHiddenChange = (index, field, value) => {
    const updated = [...formData.hiddenTestCases];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, hiddenTestCases: updated });
  };

  const addHiddenTestCase = () => {
    setFormData({
      ...formData,
      hiddenTestCases: [
        ...formData.hiddenTestCases,
        { input: "", output: "" },
      ],
    });
  };

  const removeHiddenTestCase = (index) => {
    if (formData.hiddenTestCases.length <= 1) return;
    const updated = formData.hiddenTestCases.filter((_, i) => i !== index);
    setFormData({ ...formData, hiddenTestCases: updated });
  };

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

      setFormData({
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
    } catch (err) {
      setJsonError("Invalid JSON: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const validVisibleCases = formData.visibleTestCases
      .filter((tc) => tc.input?.trim() !== "" || tc.output?.trim() !== "")
      .map((tc) => ({
        input: tc.input,
        output: tc.output,
        explanation: tc.explanation || "Example test case",
      }));

    const validHiddenCases = formData.hiddenTestCases
      .filter((tc) => tc.input?.trim() !== "" || tc.output?.trim() !== "")
      .map((tc) => ({
        input: tc.input,
        output: tc.output,
      }));

    if (validVisibleCases.length < 2) {
      setIsSubmitting(false);
      setErrorMessage(
        "Please provide at least 2 visible test cases. Click '+ Add Visible Test Case' for the second case."
      );
      return;
    }

    if (validHiddenCases.length < 2) {
      setIsSubmitting(false);
      setErrorMessage(
        "Please provide at least 2 hidden test cases. Click '+ Add Hidden Test Case' for the second case."
      );
      return;
    }

    const referenceSolution = [];
    const startCode = [];

    if (formData.pythonRefCode?.trim()) {
      referenceSolution.push({
        language: "python",
        completeCode: formData.pythonRefCode,
      });
      startCode.push({
        language: "python",
        initialCode: formData.pythonStartCode?.trim() || formData.pythonRefCode,
      });
    }

    if (formData.cppRefCode?.trim()) {
      referenceSolution.push({
        language: "cpp",
        completeCode: formData.cppRefCode,
      });
      startCode.push({
        language: "cpp",
        initialCode: formData.cppStartCode?.trim() || formData.cppRefCode,
      });
    }

    if (referenceSolution.length === 0) {
      setIsSubmitting(false);
      setErrorMessage(
        "At least one reference solution (Python or C++) is required."
      );
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      difficulty: formData.difficulty.toLowerCase().trim(),
      tags: tagsArray,
      visibleTestCases: validVisibleCases,
      hiddenTestCases: validHiddenCases,
      referenceSolution,
      startCode,
    };

    const result = await dispatch(createProblem(payload));
    setIsSubmitting(false);

    if (createProblem.fulfilled.match(result)) {
      const msg = "Problem was created successfully!";
      setSuccessMessage(msg);
      alert(msg);

      handleGoAdmin();
    } else {
      setErrorMessage(
        typeof result.payload === "string"
          ? result.payload
          : "Failed to create problem. Verify reference solution passes all test cases."
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#333333]">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#383838] bg-[#1e1e1e] hover:bg-[#2d2d2d] text-gray-300 text-xs transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-[#ffa116]" />
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
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[#2cbb5d] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[#ff375f] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#262626] p-6 sm:p-7 rounded-xl border border-[#333333] space-y-6 text-xs"
      >
        {/* Title and Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-gray-300 font-medium">Problem Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Valid Parentheses"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full h-8 px-3 bg-[#1e1e1e] border border-[#333333] rounded text-white focus:outline-none focus:border-[#ffa116]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-300 font-medium">Difficulty *</label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value })
              }
              className="w-full h-8 px-2 bg-[#1e1e1e] border border-[#333333] rounded text-white focus:outline-none focus:border-[#ffa116] capitalize cursor-pointer"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-gray-300 font-medium">Description & Constraints *</label>
          <textarea
            required
            rows={5}
            placeholder="Problem description, input/output specifications, constraints..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-3 bg-[#1e1e1e] border border-[#333333] rounded text-white leading-relaxed focus:outline-none focus:border-[#ffa116]"
          ></textarea>
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <label className="text-gray-300 font-medium">Topic Tags (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g. stack, string, hash-table"
            value={formData.tags}
            onChange={(e) =>
              setFormData({ ...formData, tags: e.target.value })
            }
            className="w-full h-8 px-3 bg-[#1e1e1e] border border-[#333333] rounded text-white focus:outline-none focus:border-[#ffa116]"
          />
        </div>

        {/* ----------------- SECTION 1: VISIBLE TEST CASES ----------------- */}
        <div className="space-y-3 pt-4 border-t border-[#333333]">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">
                Visible Test Cases ({formData.visibleTestCases.length})
              </span>
              <span className="text-[11px] text-gray-400 ml-2">
                (2 required)
              </span>
            </div>

            <button
              type="button"
              onClick={addVisibleTestCase}
              className="px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] border border-[#383838] text-gray-200 text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#ffa116]" />
              <span>Add Visible Case</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.visibleTestCases.map((tc, index) => (
              <div
                key={index}
                className="border border-[#333333] rounded-lg p-3.5 bg-[#1e1e1e] space-y-2.5"
              >
                <div className="flex items-center justify-between text-gray-400">
                  <span className="font-medium text-white">Visible Case #{index + 1}</span>
                  {formData.visibleTestCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVisibleTestCase(index)}
                      className="text-[#ff375f] hover:underline flex items-center gap-1"
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
                      required
                      rows={2}
                      placeholder="Input..."
                      value={tc.input}
                      onChange={(e) =>
                        handleVisibleChange(index, "input", e.target.value)
                      }
                      className="w-full p-2 bg-[#262626] border border-[#333333] rounded font-mono text-xs text-white"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 text-[11px]">Expected Output *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Output..."
                      value={tc.output}
                      onChange={(e) =>
                        handleVisibleChange(index, "output", e.target.value)
                      }
                      className="w-full p-2 bg-[#262626] border border-[#333333] rounded font-mono text-xs text-[#00b8a3]"
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 text-[11px]">Explanation (Optional)</label>
                  <input
                    type="text"
                    placeholder="Why this output is expected..."
                    value={tc.explanation}
                    onChange={(e) =>
                      handleVisibleChange(index, "explanation", e.target.value)
                    }
                    className="w-full h-7 px-2.5 bg-[#262626] border border-[#333333] rounded text-xs text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ----------------- SECTION 2: HIDDEN TEST CASES ----------------- */}
        <div className="space-y-3 pt-4 border-t border-[#333333]">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">
                Hidden Test Cases ({formData.hiddenTestCases.length})
              </span>
              <span className="text-[11px] text-gray-400 ml-2">
                (2 required)
              </span>
            </div>

            <button
              type="button"
              onClick={addHiddenTestCase}
              className="px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] border border-[#383838] text-gray-200 text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#ffa116]" />
              <span>Add Hidden Case</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.hiddenTestCases.map((tc, index) => (
              <div
                key={index}
                className="border border-[#333333] rounded-lg p-3.5 bg-[#1e1e1e] space-y-2.5"
              >
                <div className="flex items-center justify-between text-gray-400">
                  <span className="font-medium text-white">Hidden Case #{index + 1}</span>
                  {formData.hiddenTestCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHiddenTestCase(index)}
                      className="text-[#ff375f] hover:underline flex items-center gap-1"
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
                      required
                      rows={2}
                      placeholder="Input..."
                      value={tc.input}
                      onChange={(e) =>
                        handleHiddenChange(index, "input", e.target.value)
                      }
                      className="w-full p-2 bg-[#262626] border border-[#333333] rounded font-mono text-xs text-white"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 text-[11px]">Hidden Expected Output *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Output..."
                      value={tc.output}
                      onChange={(e) =>
                        handleHiddenChange(index, "output", e.target.value)
                      }
                      className="w-full p-2 bg-[#262626] border border-[#333333] rounded font-mono text-xs text-[#00b8a3]"
                    ></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ----------------- SECTION 3: CODE IMPLEMENTATIONS ----------------- */}
        <div className="space-y-3 pt-4 border-t border-[#333333]">
          <div>
            <span className="font-semibold text-white">Code Templates</span>
            <p className="text-[11px] text-gray-400">
              Provide complete reference code that solves the problem.
            </p>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-[#1e1e1e] p-0.5 rounded-lg border border-[#333333] text-xs w-fit">
            <button
              type="button"
              onClick={() => setActiveLangTab("python")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeLangTab === "python"
                  ? "bg-[#2d2d2d] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Python
              {formData.pythonRefCode && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00b8a3] inline-block ml-1.5"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveLangTab("cpp")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeLangTab === "cpp"
                  ? "bg-[#2d2d2d] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              C++
              {formData.cppRefCode && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00b8a3] inline-block ml-1.5"></span>
              )}
            </button>
          </div>

          {/* Python Config */}
          {activeLangTab === "python" && (
            <div className="space-y-3 bg-[#1e1e1e] p-4 rounded-lg border border-[#333333]">
              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  Python Complete Reference Solution *
                </label>
                <textarea
                  rows={8}
                  placeholder="Complete reference code..."
                  value={formData.pythonRefCode}
                  onChange={(e) =>
                    setFormData({ ...formData, pythonRefCode: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#141414] border border-[#2e2e2e] rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-[#ffa116]"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  Python Starter Code (Shown to users)
                </label>
                <textarea
                  rows={5}
                  placeholder="Starter template code..."
                  value={formData.pythonStartCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pythonStartCode: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-[#141414] border border-[#2e2e2e] rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-[#ffa116]"
                ></textarea>
              </div>
            </div>
          )}

          {/* C++ Config */}
          {activeLangTab === "cpp" && (
            <div className="space-y-3 bg-[#1e1e1e] p-4 rounded-lg border border-[#333333]">
              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  C++ Complete Reference Solution *
                </label>
                <textarea
                  rows={8}
                  placeholder="#include <iostream>&#10;using namespace std;&#10;..."
                  value={formData.cppRefCode}
                  onChange={(e) =>
                    setFormData({ ...formData, cppRefCode: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#141414] border border-[#2e2e2e] rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-[#ffa116]"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  C++ Starter Code (Shown to users)
                </label>
                <textarea
                  rows={5}
                  placeholder="#include <iostream>&#10;..."
                  value={formData.cppStartCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cppStartCode: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-[#141414] border border-[#2e2e2e] rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-[#ffa116]"
                ></textarea>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-[#333333] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleGoAdmin}
            className="px-4 py-2 rounded-md border border-[#333333] bg-[#1e1e1e] hover:bg-[#333333] text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-md bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a] font-semibold transition-colors flex items-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <div className="w-3.5 h-3.5 rounded-full border border-black border-t-transparent animate-spin"></div>
            ) : null}
            <span>Create Problem</span>
          </button>
        </div>
      </form>

      {/* JSON Import Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#262626] rounded-xl border border-[#333333] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-xs">
            <div className="p-4 border-b border-[#333333] flex items-center justify-between bg-[#222222]">
              <span className="font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#ffa116]" />
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
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/25 text-[#ff375f]">
                  {jsonError}
                </div>
              )}

              <textarea
                rows={12}
                placeholder={`{\n  "title": "Two Sum",\n  "difficulty": "easy",\n  "description": "...",\n  "visibleTestCases": [...]\n}`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-3 bg-[#1e1e1e] border border-[#333333] rounded font-mono text-xs text-white leading-relaxed focus:outline-none focus:border-[#ffa116]"
              ></textarea>
            </div>

            <div className="p-3.5 border-t border-[#333333] flex items-center justify-end gap-2 bg-[#222222]">
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="px-3 py-1.5 rounded border border-[#333333] bg-[#1e1e1e] hover:bg-[#333333] text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyJson}
                disabled={!jsonInput.trim()}
                className="px-4 py-1.5 rounded bg-[#ffa116] text-[#1a1a1a] font-semibold hover:bg-[#e68a00] transition-colors disabled:opacity-40"
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
