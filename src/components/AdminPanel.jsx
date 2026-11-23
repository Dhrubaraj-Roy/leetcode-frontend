import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  Video,
} from "lucide-react";
import VideoUploadModal from "./VideoUploadModal";

export default function AdminPanel({
  onNavigateToHome,
  onNavigateToCreateProblem,
  onSelectProblem,
}) {
  const navigate = useNavigate();
  const handleGoHome = onNavigateToHome || (() => navigate("/"));
  const handleGoCreateProblem = onNavigateToCreateProblem || (() => navigate("/problem/create"));
  const handleSelectProblem = onSelectProblem || ((id) => navigate(`/problem/${id}`));

  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { problems, isLoading } = useSelector((state) => state.problems);

  // Local state for searching & filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Modal mode: "create" | "update"
  const [modalMode, setModalMode] = useState("update");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);

  // Video Solution Modal state
  const [videoModalProblem, setVideoModalProblem] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleOpenVideoModal = (problem) => {
    setVideoModalProblem(problem);
    setIsVideoModalOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminSuccess, setAdminSuccess] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    tags: "",
    visibleTestCases: [{ input: "", output: "", explanation: "" }],
    hiddenTestCases: [{ input: "", output: "" }],
    refLanguage: "python",
    refCode: "",
  });

  useEffect(() => {
    dispatch(getAllProblems());
  }, [dispatch]);

  // Security guard
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#262626] rounded-xl border border-[#333333] text-center space-y-4">
        <div className="w-12 h-12 bg-rose-500/10 text-[#ff375f] rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Access Denied</h2>
          <p className="text-xs text-gray-400 mt-1">
            Only users with administrative privileges can access the Admin Dashboard.
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

  // Calculate statistics
  const stats = useMemo(() => {
    const total = problems.length;
    const easy = problems.filter((p) => p.difficulty?.toLowerCase() === "easy").length;
    const medium = problems.filter((p) => p.difficulty?.toLowerCase() === "medium").length;
    const hard = problems.filter((p) => p.difficulty?.toLowerCase() === "hard").length;
    return { total, easy, medium, hard };
  }, [problems]);

  // Filtered problems list
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

  // Open Create Modal
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

  // Open Update Modal
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
    } catch (_) {}
  };

  // Delete Problem
  const handleDeleteProblem = async (problemId, problemTitle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${problemTitle}"? This cannot be undone.`
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

  // Submit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAdminError(null);
    setAdminSuccess(null);

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
        setAdminSuccess("Problem created successfully!");
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

  const renderDifficulty = (difficulty) => {
    const diff = difficulty?.toLowerCase();
    if (diff === "easy") {
      return <span className="text-[#00b8a3] font-medium text-xs">Easy</span>;
    }
    if (diff === "medium") {
      return <span className="text-[#ffc01e] font-medium text-xs">Medium</span>;
    }
    return <span className="text-[#ff375f] font-medium text-xs">Hard</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#333333]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#ffa116]/10 text-[#ffa116] border border-[#ffa116]/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </span>
            <span className="text-xs text-gray-400">
              {user?.emailId || user?.email}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Problem Management
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Create new challenges, edit problem definitions, or manage solution videos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <button
            type="button"
            onClick={handleGoHome}
            className="px-3 py-1.5 rounded-md border border-[#333333] bg-[#1e1e1e] hover:bg-[#2d2d2d] text-gray-300 transition-colors"
          >
            View Public Catalog
          </button>
          <button
            type="button"
            onClick={handleGoCreateProblem || handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a] font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Problem</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {adminSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[#2cbb5d] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{adminSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminSuccess(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {adminError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[#ff375f] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{adminError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminError(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#262626] p-4 rounded-xl border border-[#333333] space-y-1">
          <div className="text-xs text-gray-400">Total Problems</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>

        <div className="bg-[#262626] p-4 rounded-xl border border-[#333333] space-y-1">
          <div className="text-xs text-[#00b8a3]">Easy</div>
          <div className="text-2xl font-bold text-[#00b8a3]">{stats.easy}</div>
        </div>

        <div className="bg-[#262626] p-4 rounded-xl border border-[#333333] space-y-1">
          <div className="text-xs text-[#ffc01e]">Medium</div>
          <div className="text-2xl font-bold text-[#ffc01e]">{stats.medium}</div>
        </div>

        <div className="bg-[#262626] p-4 rounded-xl border border-[#333333] space-y-1">
          <div className="text-xs text-[#ff375f]">Hard</div>
          <div className="text-2xl font-bold text-[#ff375f]">{stats.hard}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#262626] p-3.5 rounded-xl border border-[#333333] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#1e1e1e] border border-[#333333] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ffa116] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end text-xs">
          <span className="text-gray-400 mr-1">Difficulty:</span>
          <div className="flex items-center bg-[#1e1e1e] p-0.5 rounded-lg border border-[#333333]">
            {["all", "easy", "medium", "hard"].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                  difficultyFilter === diff
                    ? "bg-[#2d2d2d] text-white font-medium"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Problems Table */}
      <div className="bg-[#262626] rounded-xl border border-[#333333] overflow-hidden shadow-xs">
        {isLoading && problems.length === 0 ? (
          <div className="p-16 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#ffa116] border-t-transparent animate-spin"></div>
            <span>Loading problems...</span>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-xs text-gray-400">
            <p className="font-semibold text-white">No problems found</p>
            <p>Try modifying your search or create a new problem.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#333333] bg-[#222222] text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4 w-28">Difficulty</th>
                  <th className="py-3 px-4 hidden md:table-cell">Tags</th>
                  <th className="py-3 px-4 w-56 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]">
                {filteredProblems.map((prob, index) => {
                  return (
                    <tr key={prob._id || index} className="hover:bg-[#2e2e2e]/50 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            handleSelectProblem &&
                            handleSelectProblem(prob._id || prob.id)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleSelectProblem &&
                                handleSelectProblem(prob._id || prob.id);
                            }
                          }}
                          className="font-medium text-sm text-[#eff1f6] hover:text-[#ffa116] transition-colors cursor-pointer"
                        >
                          {prob.title}
                        </div>
                        <div className="text-[11px] text-gray-400 line-clamp-1 max-w-md mt-0.5">
                          {prob.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {renderDifficulty(prob.difficulty)}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {prob.tags?.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-[#1e1e1e] border border-[#333333] text-gray-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectProblem &&
                              handleSelectProblem(prob._id || prob.id)
                            }
                            className="px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] text-gray-300 hover:text-white border border-[#383838] transition-colors"
                            title="Open Problem"
                          >
                            Solve
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(prob)}
                            className="px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] text-gray-300 hover:text-white border border-[#383838] transition-colors flex items-center gap-1"
                            title="Edit Problem"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenVideoModal(prob)}
                            className="px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] text-gray-300 hover:text-white border border-[#383838] transition-colors flex items-center gap-1"
                            title="Manage Video"
                          >
                            <Video className="w-3 h-3" />
                            <span>Video</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteProblem(prob._id, prob.title)
                            }
                            className="px-2 py-1 rounded bg-[#1e1e1e] hover:bg-rose-500/10 text-gray-400 hover:text-[#ff375f] border border-[#383838] transition-colors"
                            title="Delete Problem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Edit / Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#262626] rounded-xl border border-[#333333] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#333333] flex items-center justify-between bg-[#222222]">
              <span className="font-bold text-sm text-white">
                {modalMode === "update" ? "Edit Problem" : "Create Problem"}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="p-5 space-y-4 overflow-y-auto flex-1 text-xs"
            >
              {adminError && (
                <div className="p-3 rounded bg-rose-500/10 border border-rose-500/25 text-[#ff375f] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-gray-300 font-medium">Title *</label>
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

              <div className="space-y-1">
                <label className="text-gray-300 font-medium">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#1e1e1e] border border-[#333333] rounded text-white leading-relaxed focus:outline-none focus:border-[#ffa116]"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-medium">Tags (comma-separated)</label>
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

              {/* Visible Test Cases */}
              <div className="space-y-3 pt-3 border-t border-[#333333]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    Visible Test Cases ({formData.visibleTestCases.length})
                  </span>
                  <button
                    type="button"
                    onClick={addVisibleTestCase}
                    className="px-2 py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] border border-[#333333] text-gray-200 text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Case</span>
                  </button>
                </div>

                {formData.visibleTestCases.map((tc, vIdx) => (
                  <div
                    key={vIdx}
                    className="p-3 rounded bg-[#1e1e1e] border border-[#333333] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Case #{vIdx + 1}</span>
                      {formData.visibleTestCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVisibleTestCase(vIdx)}
                          className="text-[#ff375f] hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <textarea
                        rows={2}
                        placeholder="Input..."
                        value={tc.input}
                        onChange={(e) =>
                          handleVisibleChange(vIdx, "input", e.target.value)
                        }
                        className="p-2 bg-[#262626] border border-[#333333] rounded font-mono text-xs text-white"
                      ></textarea>
                      <textarea
                        rows={2}
                        placeholder="Expected Output..."
                        value={tc.output}
                        onChange={(e) =>
                          handleVisibleChange(vIdx, "output", e.target.value)
                        }
                        className="p-2 bg-[#262626] border border-[#333333] rounded font-mono text-xs text-[#00b8a3]"
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hidden Test Cases */}
              <div className="space-y-3 pt-3 border-t border-[#333333]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    Hidden Test Cases ({formData.hiddenTestCases.length})
                  </span>
                  <button
                    type="button"
                    onClick={addHiddenTestCase}
                    className="px-2 py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] border border-[#333333] text-gray-200 text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Secret Case</span>
                  </button>
                </div>

                {formData.hiddenTestCases.map((tc, hIdx) => (
                  <div
                    key={hIdx}
                    className="p-3 rounded bg-[#1e1e1e] border border-[#333333] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Secret Case #{hIdx + 1}</span>
                      {formData.hiddenTestCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHiddenTestCase(hIdx)}
                          className="text-[#ff375f] hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <textarea
                        rows={2}
                        placeholder="Hidden Input..."
                        value={tc.input}
                        onChange={(e) =>
                          handleHiddenChange(hIdx, "input", e.target.value)
                        }
                        className="p-2 bg-[#262626] border border-[#333333] rounded font-mono text-xs text-white"
                      ></textarea>
                      <textarea
                        rows={2}
                        placeholder="Hidden Output..."
                        value={tc.output}
                        onChange={(e) =>
                          handleHiddenChange(hIdx, "output", e.target.value)
                        }
                        className="p-2 bg-[#262626] border border-[#333333] rounded font-mono text-xs text-[#00b8a3]"
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reference Solution Code */}
              <div className="space-y-2 pt-3 border-t border-[#333333]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Reference Solution</span>
                  <select
                    value={formData.refLanguage}
                    onChange={(e) =>
                      setFormData({ ...formData, refLanguage: e.target.value })
                    }
                    className="h-7 px-2 bg-[#1e1e1e] border border-[#333333] rounded text-xs text-white"
                  >
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <textarea
                  rows={6}
                  placeholder="Complete reference code..."
                  value={formData.refCode}
                  onChange={(e) =>
                    setFormData({ ...formData, refCode: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#1a1a1a] border border-[#333333] rounded font-mono text-xs text-gray-200 leading-relaxed focus:outline-none focus:border-[#ffa116]"
                ></textarea>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#333333] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#333333] bg-[#1e1e1e] hover:bg-[#333333] text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a] font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-3 h-3 rounded-full border border-black border-t-transparent animate-spin"></div>
                  ) : null}
                  <span>{modalMode === "update" ? "Save Changes" : "Create Problem"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Solution Modal */}
      <VideoUploadModal
        isOpen={isVideoModalOpen}
        problem={videoModalProblem}
        onClose={() => setIsVideoModalOpen(false)}
        onVideoUpdated={() => dispatch(getAllProblems())}
      />
    </div>
  );
}
