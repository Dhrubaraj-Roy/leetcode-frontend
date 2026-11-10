import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllProblems,
  deleteProblem,
  createProblem,
  updateProblem,
} from "../store/problemSlice";
import { fetchProblemById } from "../lib/api";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Search,
  AlertTriangle,
  Code2,
  Layers,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileEdit,
  Play,
} from "lucide-react";

export default function AdminPanel({
  onNavigateToHome,
  onNavigateToCreateProblem,
  onSelectProblem,
}) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { problems, isLoading } = useSelector((state) => state.problems);

  // Local state for searching & filtering inside admin panel
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Modal mode: "create" | "update"
  const [modalMode, setModalMode] = useState("update");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);

  // Form loading & alert states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminSuccess, setAdminSuccess] = useState(null);

  // Form state for creating / updating a problem (supports multiple test cases)
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
    refLanguage: "python",
    refCode: "",
  });

  // Ensure problems are loaded
  useEffect(() => {
    dispatch(getAllProblems());
  }, [dispatch]);

  // Security guard: If user is not authenticated or not an admin
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
          You do not have administrative privileges to access this area. Only
          authenticated users with the <strong>admin</strong> role can access
          the Admin Panel.
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

  // Calculate catalog stats
  const stats = useMemo(() => {
    const total = problems.length;
    const easy = problems.filter((p) => p.difficulty?.toLowerCase() === "easy").length;
    const medium = problems.filter((p) => p.difficulty?.toLowerCase() === "medium").length;
    const hard = problems.filter((p) => p.difficulty?.toLowerCase() === "hard").length;
    return { total, easy, medium, hard };
  }, [problems]);

  // Filtered problems list for Admin view
  const filteredProblems = useMemo(() => {
    return problems.filter((prob) => {
      if (
        difficultyFilter !== "all" &&
        prob.difficulty?.toLowerCase() !== difficultyFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = prob.title?.toLowerCase().includes(term);
        const matchesTags = prob.tags?.some((t) =>
          t.toLowerCase().includes(term)
        );
        if (!matchesTitle && !matchesTags) return false;
      }
      return true;
    });
  }, [problems, searchTerm, difficultyFilter]);

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

  // 1. OPEN CREATE MODAL
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingProblemId(null);
    setAdminError(null);
    setFormData({
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
      refLanguage: "python",
      refCode: "",
    });
    setIsModalOpen(true);
  };

  // 2. OPEN UPDATE MODAL (Pre-fills ALL existing problem values, including multiple test cases)
  const handleOpenUpdateModal = async (prob) => {
    setModalMode("update");
    setEditingProblemId(prob._id);
    setAdminError(null);

    const initialVisCases =
      Array.isArray(prob.visibleTestCases) && prob.visibleTestCases.length > 0
        ? prob.visibleTestCases.map((tc) => ({
            input: tc.input || "",
            output: tc.output || "",
            explanation: tc.explanation || "",
          }))
        : [
            { input: "", output: "", explanation: "" },
            { input: "", output: "", explanation: "" },
          ];

    const initialHidCases =
      Array.isArray(prob.hiddenTestCases) && prob.hiddenTestCases.length > 0
        ? prob.hiddenTestCases.map((tc) => ({
            input: tc.input || "",
            output: tc.output || "",
          }))
        : [
            { input: "", output: "" },
            { input: "", output: "" },
          ];

    // Immediately prefill form with existing problem values
    setFormData({
      title: prob.title || "",
      description: prob.description || "",
      difficulty: prob.difficulty?.toLowerCase() || "easy",
      tags: Array.isArray(prob.tags) ? prob.tags.join(", ") : prob.tags || "",
      visibleTestCases: initialVisCases,
      hiddenTestCases: initialHidCases,
      refLanguage:
        prob.referenceSolution?.[0]?.language ||
        prob.startCode?.[0]?.language ||
        "python",
      refCode:
        prob.referenceSolution?.[0]?.completeCode ||
        prob.startCode?.[0]?.initialCode ||
        "",
    });

    setIsModalOpen(true);

    // Fetch full problem details by ID in background to capture hidden test cases & ref code
    try {
      const fullProblem = await fetchProblemById(prob._id);
      if (fullProblem) {
        const fullVisCases =
          Array.isArray(fullProblem.visibleTestCases) &&
          fullProblem.visibleTestCases.length > 0
            ? fullProblem.visibleTestCases.map((tc) => ({
                input: tc.input || "",
                output: tc.output || "",
                explanation: tc.explanation || "",
              }))
            : initialVisCases;

        const fullHidCases =
          Array.isArray(fullProblem.hiddenTestCases) &&
          fullProblem.hiddenTestCases.length > 0
            ? fullProblem.hiddenTestCases.map((tc) => ({
                input: tc.input || "",
                output: tc.output || "",
              }))
            : initialHidCases;

        setFormData((prev) => ({
          ...prev,
          title: fullProblem.title ?? prev.title,
          description: fullProblem.description ?? prev.description,
          difficulty: fullProblem.difficulty?.toLowerCase() ?? prev.difficulty,
          tags: Array.isArray(fullProblem.tags)
            ? fullProblem.tags.join(", ")
            : prev.tags,
          visibleTestCases: fullVisCases,
          hiddenTestCases: fullHidCases,
          refLanguage:
            fullProblem.referenceSolution?.[0]?.language ||
            fullProblem.startCode?.[0]?.language ||
            prev.refLanguage,
          refCode:
            fullProblem.referenceSolution?.[0]?.completeCode ||
            fullProblem.startCode?.[0]?.initialCode ||
            prev.refCode,
        }));
      }
    } catch (_) {
      // Keep initial pre-filled data
    }
  };

  // 3. DELETE PROBLEM HANDLER
  const handleDeleteProblem = async (problemId, problemTitle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${problemTitle}"? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setAdminError(null);
    setAdminSuccess(null);

    const result = await dispatch(deleteProblem(problemId));
    if (deleteProblem.fulfilled.match(result)) {
      setAdminSuccess(`Problem "${problemTitle}" deleted successfully.`);
      setTimeout(() => setAdminSuccess(null), 4000);
    } else {
      setAdminError(result.payload || "Failed to delete problem.");
    }
  };

  // SUBMIT FORM (Handles either CREATE or UPDATE based on modalMode)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAdminError(null);
    setAdminSuccess(null);

    // Parse comma-separated tags
    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const validVisible = formData.visibleTestCases
      .filter((tc) => tc.input?.trim() !== "" || tc.output?.trim() !== "")
      .map((tc) => ({
        input: tc.input,
        output: tc.output,
        explanation: tc.explanation || "Example test case",
      }));

    const validHidden = formData.hiddenTestCases
      .filter((tc) => tc.input?.trim() !== "" || tc.output?.trim() !== "")
      .map((tc) => ({
        input: tc.input,
        output: tc.output,
      }));

    if (modalMode === "create") {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty.toLowerCase(),
        tags: tagsArray,
        visibleTestCases: validVisible,
        hiddenTestCases: validHidden,
        referenceSolution: [
          {
            language: formData.refLanguage,
            completeCode: formData.refCode,
          },
        ],
        startCode: [
          {
            language: formData.refLanguage,
            initialCode: formData.refCode,
          },
        ],
      };

      const result = await dispatch(createProblem(payload));
      setIsSubmitting(false);

      if (createProblem.fulfilled.match(result)) {
        setAdminSuccess("Problem verified and created successfully!");
        setIsModalOpen(false);
        setTimeout(() => setAdminSuccess(null), 4000);
      } else {
        setAdminError(
          typeof result.payload === "string"
            ? result.payload
            : "Failed to create problem. Please verify reference code and inputs."
        );
      }
    } else {
      // UPDATE PROBLEM
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty.toLowerCase(),
        tags: tagsArray,
        visibleTestCases: validVisible,
        hiddenTestCases: validHidden,
        referenceSolution: formData.refCode
          ? [
              {
                language: formData.refLanguage,
                completeCode: formData.refCode,
              },
            ]
          : undefined,
        startCode: formData.refCode
          ? [
              {
                language: formData.refLanguage,
                initialCode: formData.refCode,
              },
            ]
          : undefined,
      };

      const result = await dispatch(
        updateProblem({ id: editingProblemId, problemData: payload })
      );
      setIsSubmitting(false);

      if (updateProblem.fulfilled.match(result)) {
        setAdminSuccess("Problem updated successfully!");
        setIsModalOpen(false);
        setTimeout(() => setAdminSuccess(null), 4000);
      } else {
        setAdminError(
          typeof result.payload === "string"
            ? result.payload
            : "Failed to update problem."
        );
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-base-300">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-warning font-semibold gap-1.5 py-3 px-3">
              <ShieldCheck className="w-4 h-4" />
              Admin Panel
            </span>
            <span className="text-xs text-base-content/60 font-mono">
              Signed in as {user?.emailId || user?.email}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">
            Problem Management
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Create new challenges, update existing problem details, or delete
            outdated records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="btn btn-outline btn-sm"
          >
            View Public Catalog
          </button>
          {/* Button 1: CREATE PROBLEM (Navigates to /problem/create route) */}
          <button
            type="button"
            onClick={onNavigateToCreateProblem || handleOpenCreateModal}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Problem
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {adminSuccess && (
        <div className="alert alert-success shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{adminSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminSuccess(null)}
            className="btn btn-ghost btn-xs btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {adminError && (
        <div className="alert alert-error shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{adminError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminError(null)}
            className="btn btn-ghost btn-xs btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-primary">
            <Code2 className="w-6 h-6" />
          </div>
          <div className="stat-title text-xs">Total Challenges</div>
          <div className="stat-value text-2xl text-primary">{stats.total}</div>
        </div>

        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-emerald-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="stat-title text-xs">Easy Problems</div>
          <div className="stat-value text-2xl text-emerald-500">{stats.easy}</div>
        </div>

        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-amber-500">
            <Layers className="w-6 h-6" />
          </div>
          <div className="stat-title text-xs">Medium Problems</div>
          <div className="stat-value text-2xl text-amber-500">{stats.medium}</div>
        </div>

        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-rose-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="stat-title text-xs">Hard Problems</div>
          <div className="stat-value text-2xl text-rose-500">{stats.hard}</div>
        </div>
      </div>

      {/* Search & Difficulty Filter */}
      <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-300 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search problems by title or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-base-content/60 font-medium">
            Difficulty:
          </span>
          <div className="join">
            {["all", "easy", "medium", "hard"].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`join-item btn btn-xs capitalize ${
                  difficultyFilter === diff ? "btn-primary" : "btn-ghost"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Problems Management Table */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
        {isLoading && problems.length === 0 ? (
          <div className="p-12 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-xs text-base-content/60 mt-2">
              Loading problems...
            </p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Code2 className="w-10 h-10 mx-auto text-base-content/30" />
            <h3 className="font-semibold text-base-content">
              No problems found
            </h3>
            <p className="text-xs text-base-content/60">
              Try adjusting your search criteria or create a new problem.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/60 text-xs text-base-content/70">
                  <th className="w-16">#</th>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Tags</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((prob, index) => {
                  const diffColor =
                    prob.difficulty?.toLowerCase() === "easy"
                      ? "badge-success text-success-content"
                      : prob.difficulty?.toLowerCase() === "medium"
                      ? "badge-warning text-warning-content"
                      : "badge-error text-error-content";

                  return (
                    <tr key={prob._id || index} className="hover:bg-base-200/40">
                      <td className="text-xs font-mono text-base-content/50">
                        {index + 1}
                      </td>
                      <td>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            onSelectProblem &&
                            onSelectProblem(prob._id || prob.id)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              onSelectProblem &&
                                onSelectProblem(prob._id || prob.id);
                            }
                          }}
                          className="font-medium text-sm text-base-content hover:text-primary transition-colors cursor-pointer"
                          title="Click to view problem details and code editor"
                        >
                          {prob.title}
                        </div>
                        <div className="text-xs text-base-content/50 line-clamp-1 max-w-md mt-0.5">
                          {prob.description}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge badge-sm font-semibold capitalize ${diffColor}`}
                        >
                          {prob.difficulty}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {prob.tags?.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="badge badge-ghost badge-xs text-base-content/70"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Button: SOLVE / VIEW PROBLEM */}
                          <button
                            type="button"
                            onClick={() =>
                              onSelectProblem &&
                              onSelectProblem(prob._id || prob.id)
                            }
                            className="btn btn-outline btn-primary btn-xs gap-1"
                            title="View Problem & Code Editor"
                          >
                            <Play className="w-3.5 h-3.5 fill-primary" />
                            Solve
                          </button>

                          {/* Button 2: UPDATE PROBLEM */}
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(prob)}
                            className="btn btn-outline btn-info btn-xs gap-1"
                            title="Update Problem"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Update Problem
                          </button>

                          {/* Button 3: DELETE PROBLEM */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteProblem(prob._id, prob.title)
                            }
                            className="btn btn-outline btn-error btn-xs gap-1"
                            title="Delete Problem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Problem
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for UPDATE PROBLEM (supports multiple test cases) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-base-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {modalMode === "update" ? (
                  <FileEdit className="w-5 h-5 text-info" />
                ) : (
                  <Code2 className="w-5 h-5 text-primary" />
                )}
                <div>
                  <h3 className="font-bold text-lg text-base-content">
                    {modalMode === "update"
                      ? "Update Problem"
                      : "Create New Problem"}
                  </h3>
                  {modalMode === "update" && (
                    <p className="text-xs text-base-content/60">
                      Existing values and test cases are pre-filled below. Modify
                      any fields and click Update Problem to save changes.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >
              {adminError && (
                <div className="alert alert-error text-xs py-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-base-content/80">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Valid Parentheses"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="input input-sm input-bordered w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-base-content/80">
                    Difficulty *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value })
                    }
                    className="select select-sm select-bordered w-full capitalize"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-base-content/80">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Problem description, constraints, and instructions..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="textarea textarea-bordered textarea-sm w-full leading-relaxed"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-base-content/80">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. stack, string"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="input input-sm input-bordered w-full"
                />
              </div>

              {/* Visible Test Cases */}
              <div className="space-y-3 pt-2 border-t border-base-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-warning" />
                      Visible Test Cases ({formData.visibleTestCases.length})
                    </span>
                    <p className="text-[11px] text-warning font-semibold">
                      You have to upload two test cases.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVisibleTestCase}
                    className="btn btn-outline btn-xs gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Visible Case
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.visibleTestCases.map((tc, index) => (
                    <div
                      key={index}
                      className="border border-base-300 rounded-lg p-3 bg-base-200/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="badge badge-warning badge-xs font-semibold">
                          Case #{index + 1}
                        </span>
                        {formData.visibleTestCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVisibleTestCase(index)}
                            className="btn btn-ghost btn-xs text-error gap-1 hover:bg-error/10"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-base-content/70">
                            Input *
                          </label>
                          <textarea
                            rows={2}
                            value={tc.input}
                            onChange={(e) =>
                              handleVisibleChange(index, "input", e.target.value)
                            }
                            className="textarea textarea-bordered textarea-xs w-full font-mono"
                          ></textarea>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-base-content/70">
                            Expected Output *
                          </label>
                          <textarea
                            rows={2}
                            value={tc.output}
                            onChange={(e) =>
                              handleVisibleChange(index, "output", e.target.value)
                            }
                            className="textarea textarea-bordered textarea-xs w-full font-mono"
                          ></textarea>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-base-content/70">
                          Explanation (Optional)
                        </label>
                        <input
                          type="text"
                          value={tc.explanation}
                          onChange={(e) =>
                            handleVisibleChange(index, "explanation", e.target.value)
                          }
                          className="input input-bordered input-xs w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden Test Cases */}
              <div className="space-y-3 pt-2 border-t border-base-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-secondary" />
                      Hidden Test Cases ({formData.hiddenTestCases.length})
                    </span>
                    <p className="text-[11px] text-warning font-semibold">
                      You have to upload two test cases.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addHiddenTestCase}
                    className="btn btn-outline btn-xs gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Hidden Case
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.hiddenTestCases.map((tc, index) => (
                    <div
                      key={index}
                      className="border border-base-300 rounded-lg p-3 bg-base-200/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="badge badge-secondary badge-xs font-semibold">
                          Hidden Case #{index + 1}
                        </span>
                        {formData.hiddenTestCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHiddenTestCase(index)}
                            className="btn btn-ghost btn-xs text-error gap-1 hover:bg-error/10"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-base-content/70">
                            Hidden Input *
                          </label>
                          <textarea
                            rows={2}
                            value={tc.input}
                            onChange={(e) =>
                              handleHiddenChange(index, "input", e.target.value)
                            }
                            className="textarea textarea-bordered textarea-xs w-full font-mono"
                          ></textarea>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-base-content/70">
                            Hidden Expected Output *
                          </label>
                          <textarea
                            rows={2}
                            value={tc.output}
                            onChange={(e) =>
                              handleHiddenChange(index, "output", e.target.value)
                            }
                            className="textarea textarea-bordered textarea-xs w-full font-mono"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference Solution Code */}
              <div className="space-y-1.5 pt-2 border-t border-base-300">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-base-content/80">
                    Reference Solution Code
                  </label>
                  <select
                    value={formData.refLanguage}
                    onChange={(e) =>
                      setFormData({ ...formData, refLanguage: e.target.value })
                    }
                    className="select select-xs select-bordered"
                  >
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <textarea
                  rows={5}
                  placeholder="# Complete working reference solution"
                  value={formData.refCode}
                  onChange={(e) =>
                    setFormData({ ...formData, refCode: e.target.value })
                  }
                  className="textarea textarea-bordered textarea-sm w-full font-mono text-xs"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-base-300 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn btn-sm gap-2 ${
                    modalMode === "update" ? "btn-info" : "btn-primary"
                  }`}
                >
                  {isSubmitting && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                  {modalMode === "update" ? "Update Problem" : "Create Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
