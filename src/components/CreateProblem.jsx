import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createProblem } from "../store/problemSlice";
import {
  ArrowLeft,
  Code2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  FileCode,
  X,
  Layers,
} from "lucide-react";

export default function CreateProblem({ onNavigateToAdmin, onNavigateToHome }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Form state: by default shows ONE input for visible and hidden test cases, with option to add another one
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

  // Active language tab for solution & template: "python" | "cpp"
  const [activeLangTab, setActiveLangTab] = useState("python");

  // Quick JSON Import modal state
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Security Guard: Admin only
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-base-100 rounded-2xl shadow-xl border border-error/20 text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-base-content mb-2">
          Access Denied
        </h2>
        <p className="text-base-content/70 mb-6 text-sm">
          You must be signed in with an <strong>admin</strong> account to create
          problems.
        </p>
        <button
          type="button"
          onClick={onNavigateToHome}
          className="btn btn-primary"
        >
          Return to Home
        </button>
      </div>
    );
  }

  // --- Visible Test Cases Handlers ---
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

  // --- Hidden Test Cases Handlers ---
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

  // --- Quick Import from JSON ---
  const handleApplyJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput.trim());

      // Extract tags
      let tagsStr = "";
      if (Array.isArray(parsed.tags)) {
        tagsStr = parsed.tags.join(", ");
      } else if (typeof parsed.tags === "string") {
        tagsStr = parsed.tags;
      }

      // Extract visible test cases
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

      // Extract hidden test cases
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

      // Extract reference solutions & start code
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
      setJsonError("Failed to parse JSON: " + err.message);
    }
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Parse tags from comma-separated string
    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Filter test cases that have input and output
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

    // Enforce 2 test cases as requested
    if (validVisibleCases.length < 2) {
      setIsSubmitting(false);
      setErrorMessage(
        "You have to upload two test cases for visible test cases. Please click '+ Add Visible Test Case' to provide the second one."
      );
      return;
    }

    if (validHiddenCases.length < 2) {
      setIsSubmitting(false);
      setErrorMessage(
        "You have to upload two test cases for hidden test cases. Please click '+ Add Hidden Test Case' to provide the second one."
      );
      return;
    }

    // Build reference solution and starter code arrays
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

    // Build complete payload matching backend createProblem controller
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

      // Send browser alert as requested
      alert(msg);

      // Redirect back to Admin Panel
      if (onNavigateToAdmin) {
        onNavigateToAdmin();
      }
    } else {
      setErrorMessage(
        typeof result.payload === "string"
          ? result.payload
          : "Failed to create problem. Please verify reference solution passes all test cases."
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header / Breadcrumb & JSON Import Button */}
      <div className="flex items-center justify-between pb-4 border-b border-base-300">
        <button
          type="button"
          onClick={onNavigateToAdmin}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Panel
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setJsonError(null);
              setIsJsonModalOpen(true);
            }}
            className="btn btn-outline btn-secondary btn-sm gap-1.5"
            title="Import from JSON"
          >
            <FileCode className="w-4 h-4" />
            Import / Paste JSON
          </button>

        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setJsonError(null);
              setIsJsonModalOpen(true);
            }}
            className="btn btn-outline btn-secondary btn-sm gap-1.5"
            title="Import from JSON"
          >
            <FileCode className="w-4 h-4" />
            Import / Paste JSON
          </button>
          <span className="badge badge-warning badge-sm font-semibold">
            Route: /problem/create
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-base-content flex items-center gap-2">
          <Code2 className="w-8 h-8 text-primary" />
          Create New Problem
        </h1>
        <p className="text-sm text-base-content/70">
          Upload challenges with visible and hidden test cases. You have to upload
          two test cases for both visible and hidden test cases.
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="alert alert-success shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error shadow-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-base-100 p-6 sm:p-8 rounded-2xl shadow-sm border border-base-300 space-y-8"
      >
        {/* Title and Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-base-content/80">
              Problem Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Valid Parentheses"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input input-bordered w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-base-content/80">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value })
              }
              className="select select-bordered w-full capitalize"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-base-content/80">
            Problem Description & Constraints *
          </label>
          <textarea
            required
            rows={5}
            placeholder="e.g. Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="textarea textarea-bordered w-full text-sm leading-relaxed"
          ></textarea>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-base-content/80">
            Topic Tags (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. stack, string"
            value={formData.tags}
            onChange={(e) =>
              setFormData({ ...formData, tags: e.target.value })
            }
            className="input input-bordered w-full"
          />
          <p className="text-xs text-base-content/50">
            Used for filtering problems on the catalog (e.g. stack, string).
          </p>
        </div>

        {/* ----------------- SECTION 1: VISIBLE TEST CASES ----------------- */}
        <div className="space-y-4 pt-4 border-t border-base-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-warning" />
                Visible Test Cases ({formData.visibleTestCases.length})
                <span className="badge badge-warning badge-xs font-semibold">2 Required</span>
              </h3>
              <p className="text-xs text-warning font-semibold mt-1">
                You have to upload two test cases.
              </p>
              <p className="text-xs text-base-content/60 mt-0.5">
                Shown to users on the problem page and evaluated when clicking "Run Code".
              </p>
            </div>

            <button
              type="button"
              onClick={addVisibleTestCase}
              className="btn btn-outline btn-sm gap-1 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Visible Test Case
            </button>
          </div>

          <div className="space-y-4">
            {formData.visibleTestCases.map((tc, index) => (
              <div
                key={index}
                className="border border-base-300 rounded-xl p-4 bg-base-200/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-warning badge-sm font-semibold">
                    Visible Test Case #{index + 1}
                  </span>
                  {formData.visibleTestCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVisibleTestCase(index)}
                      className="btn btn-ghost btn-xs text-error gap-1 hover:bg-error/10"
                      title="Remove test case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-base-content/70">
                      Input *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder={
                        index === 0
                          ? "e.g. ()"
                          : index === 1
                          ? "e.g. ()[]{}"
                          : "Test case input..."
                      }
                      value={tc.input}
                      onChange={(e) =>
                        handleVisibleChange(index, "input", e.target.value)
                      }
                      className="textarea textarea-bordered w-full font-mono text-xs"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-base-content/70">
                      Expected Output *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder={
                        index === 0
                          ? "e.g. true\n"
                          : index === 1
                          ? "e.g. true\n"
                          : "Expected output..."
                      }
                      value={tc.output}
                      onChange={(e) =>
                        handleVisibleChange(index, "output", e.target.value)
                      }
                      className="textarea textarea-bordered w-full font-mono text-xs"
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-base-content/70">
                    Explanation (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={
                      index === 0
                        ? "e.g. The opening round bracket is immediately closed by the corresponding closing bracket."
                        : index === 1
                        ? "e.g. All brackets are closed in the correct order by matching bracket types."
                        : "Explanation for why this is the output..."
                    }
                    value={tc.explanation}
                    onChange={(e) =>
                      handleVisibleChange(index, "explanation", e.target.value)
                    }
                    className="input input-bordered input-sm w-full text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ----------------- SECTION 2: HIDDEN TEST CASES ----------------- */}
        <div className="space-y-4 pt-4 border-t border-base-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                Hidden Test Cases ({formData.hiddenTestCases.length})
                <span className="badge badge-secondary badge-xs font-semibold">2 Required</span>
              </h3>
              <p className="text-xs text-warning font-semibold mt-1">
                You have to upload two test cases.
              </p>
              <p className="text-xs text-base-content/60 mt-0.5">
                Secret test cases evaluated during "Submit" to prevent
                hardcoded solutions.
              </p>
            </div>

            <button
              type="button"
              onClick={addHiddenTestCase}
              className="btn btn-outline btn-sm gap-1 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Hidden Test Case
            </button>
          </div>

          <div className="space-y-4">
            {formData.hiddenTestCases.map((tc, index) => (
              <div
                key={index}
                className="border border-base-300 rounded-xl p-4 bg-base-200/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-secondary badge-sm font-semibold">
                    Hidden Test Case #{index + 1}
                  </span>
                  {formData.hiddenTestCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHiddenTestCase(index)}
                      className="btn btn-ghost btn-xs text-error gap-1 hover:bg-error/10"
                      title="Remove test case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-base-content/70">
                      Hidden Input *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder={
                        index === 0
                          ? "e.g. (]"
                          : index === 1
                          ? "e.g. ([)]"
                          : "Hidden test input..."
                      }
                      value={tc.input}
                      onChange={(e) =>
                        handleHiddenChange(index, "input", e.target.value)
                      }
                      className="textarea textarea-bordered w-full font-mono text-xs"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-base-content/70">
                      Hidden Expected Output *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder={
                        index === 0
                          ? "e.g. false\n"
                          : index === 1
                          ? "e.g. false\n"
                          : "Hidden expected output..."
                      }
                      value={tc.output}
                      onChange={(e) =>
                        handleHiddenChange(index, "output", e.target.value)
                      }
                      className="textarea textarea-bordered w-full font-mono text-xs"
                    ></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ----------------- SECTION 3: CODE IMPLEMENTATIONS (Python & C++) ----------------- */}
        <div className="space-y-4 pt-4 border-t border-base-300">
          <div>
            <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Reference Solutions & Starter Templates
            </h3>
            <p className="text-xs text-base-content/60">
              Provide complete reference solution code and starter templates.
              Switch tabs to configure Python and C++.
            </p>
          </div>

          {/* Language Tabs */}
          <div className="tabs tabs-boxed bg-base-200 p-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveLangTab("python")}
              className={`tab tab-sm font-semibold gap-2 ${
                activeLangTab === "python" ? "tab-active" : ""
              }`}
            >
              Python
              {formData.pythonRefCode && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveLangTab("cpp")}
              className={`tab tab-sm font-semibold gap-2 ${
                activeLangTab === "cpp" ? "tab-active" : ""
              }`}
            >
              C++
              {formData.cppRefCode && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>

          {/* Python Tab Content */}
          {activeLangTab === "python" && (
            <div className="space-y-4 bg-base-200/30 p-4 rounded-xl border border-base-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-base-content/80 flex items-center justify-between">
                  <span>Python Complete Reference Solution</span>
                  <span className="text-[11px] text-base-content/50">
                    Must pass all visible & hidden test cases
                  </span>
                </label>
                <textarea
                  rows={8}
                  placeholder={`e.g.\nimport sys\n\ndef isValid(s: str) -> bool:\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return len(stack) == 0\n\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    if s:\n        print("true" if isValid(s) else "false")`}
                  value={formData.pythonRefCode}
                  onChange={(e) =>
                    setFormData({ ...formData, pythonRefCode: e.target.value })
                  }
                  className="textarea textarea-bordered w-full font-mono text-xs leading-relaxed"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-base-content/80">
                  Python Starter Code (Boilerplate provided to users)
                </label>
                <textarea
                  rows={5}
                  placeholder={`e.g.\nimport sys\n\ndef isValid(s: str) -> bool:\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    if s:\n        print("true" if isValid(s) else "false")`}
                  value={formData.pythonStartCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pythonStartCode: e.target.value,
                    })
                  }
                  className="textarea textarea-bordered w-full font-mono text-xs leading-relaxed"
                ></textarea>
              </div>
            </div>
          )}

          {/* C++ Tab Content */}
          {activeLangTab === "cpp" && (
            <div className="space-y-4 bg-base-200/30 p-4 rounded-xl border border-base-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-base-content/80 flex items-center justify-between">
                  <span>C++ Complete Reference Solution</span>
                  <span className="text-[11px] text-base-content/50">
                    Must pass all visible & hidden test cases
                  </span>
                </label>
                <textarea
                  rows={8}
                  placeholder={`e.g.\n#include <iostream>\n#include <string>\n#include <stack>\n\nusing namespace std;\n\nbool isValid(string s) {\n    stack<char> st;\n    for (char c : s) {\n        if (c == '(' || c == '{' || c == '[') {\n            st.push(c);\n        } else {\n            if (st.empty()) return false;\n            char top = st.top();\n            st.pop();\n            if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) return false;\n        }\n    }\n    return st.empty();\n}\n\nint main() {\n    string s;\n    if (cin >> s) {\n        cout << (isValid(s) ? "true" : "false") << "\\n";\n    }\n    return 0;\n}`}
                  value={formData.cppRefCode}
                  onChange={(e) =>
                    setFormData({ ...formData, cppRefCode: e.target.value })
                  }
                  className="textarea textarea-bordered w-full font-mono text-xs leading-relaxed"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-base-content/80">
                  C++ Starter Code (Boilerplate provided to users)
                </label>
                <textarea
                  rows={5}
                  placeholder={`e.g.\n#include <iostream>\n#include <string>\n#include <stack>\n\nusing namespace std;\n\nbool isValid(string s) {\n    // Write your solution here\n    return false;\n}\n\nint main() {\n    string s;\n    if (cin >> s) {\n        cout << (isValid(s) ? "true" : "false") << "\\n";\n    }\n    return 0;\n}`}
                  value={formData.cppStartCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cppStartCode: e.target.value,
                    })
                  }
                  className="textarea textarea-bordered w-full font-mono text-xs leading-relaxed"
                ></textarea>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-base-300 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onNavigateToAdmin}
            disabled={isSubmitting}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Evaluating on Judge0 & Publishing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Problem
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Import from JSON Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-5 border-b border-base-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-secondary" />
                <div>
                  <h3 className="font-bold text-lg text-base-content">
                    Import Problem from JSON
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Paste the complete problem JSON object to automatically
                    populate all fields, test cases, and code.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {jsonError && (
                <div className="alert alert-error text-xs py-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{jsonError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-base-content/80">
                  Paste JSON Structure
                </label>
                <textarea
                  rows={14}
                  placeholder={`{\n  "title": "Valid Parentheses",\n  "description": "...",\n  "difficulty": "easy",\n  "tags": ["stack", "string"],\n  "visibleTestCases": [...],\n  "hiddenTestCases": [...],\n  "startCode": [...],\n  "referenceSolution": [...]\n}`}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="textarea textarea-bordered w-full font-mono text-xs"
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-base-300 flex justify-end gap-3 bg-base-200/30">
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyJson}
                disabled={!jsonInput.trim()}
                className="btn btn-secondary btn-sm gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Populate Form Fields
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
