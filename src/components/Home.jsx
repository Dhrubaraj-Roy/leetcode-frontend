import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getAllProblems,
  getSolvedProblems,
  setStatusFilter,
  setDifficultyFilter,
  setTagFilter,
  setSearchQuery,
  resetFilters,
} from "../store/problemSlice";
import {
  CheckCircle2,
  Circle,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function Home({ onSelectProblem }) {
  const navigate = useNavigate();
  const handleSelectProblem = onSelectProblem || ((id) => navigate(`/problem/${id}`));

  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { problems, solvedProblems, isLoading, filters } = useSelector(
    (state) => state.problems
  );

  useEffect(() => {
    const allProblemsPromise = dispatch(getAllProblems());
    let solvedPromise = null;
    if (isAuthenticated) {
      solvedPromise = dispatch(getSolvedProblems());
    }

    return () => {
      // Abort in-flight catalog requests if navigating away
      allProblemsPromise.abort();
      if (solvedPromise) {
        solvedPromise.abort();
      }
    };
  }, [dispatch, isAuthenticated]);

  const solvedIdSet = useMemo(() => {
    return new Set(
      solvedProblems.map((p) =>
        typeof p === "string" ? p : p._id || p.id || ""
      )
    );
  }, [solvedProblems]);

  const availableTags = useMemo(() => {
    const tagSet = new Set();
    problems.forEach((prob) => {
      if (Array.isArray(prob.tags)) {
        prob.tags.forEach((t) => tagSet.add(t.toLowerCase().trim()));
      }
    });
    return Array.from(tagSet).sort();
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((prob) => {
      const isSolved = solvedIdSet.has(prob._id);

      if (filters.status === "solved" && !isSolved) {
        return false;
      }

      if (
        filters.difficulty !== "all" &&
        prob.difficulty?.toLowerCase() !== filters.difficulty.toLowerCase()
      ) {
        return false;
      }

      if (filters.tag !== "all") {
        const hasTag = prob.tags?.some(
          (t) => t.toLowerCase().trim() === filters.tag.toLowerCase().trim()
        );
        if (!hasTag) return false;
      }

      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesTitle = prob.title?.toLowerCase().includes(query);
        const matchesTag = prob.tags?.some((t) =>
          t.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesTag) return false;
      }

      return true;
    });
  }, [problems, solvedIdSet, filters]);

  // Authentic LeetCode difficulty colored text
  const renderDifficulty = (difficulty) => {
    const diff = difficulty?.toLowerCase();
    if (diff === "easy") {
      return <span className="text-[#00b8a3] font-medium text-xs">Easy</span>;
    }
    if (diff === "medium") {
      return <span className="text-[#ffc01e] font-medium text-xs">Medium</span>;
    }
    if (diff === "hard") {
      return <span className="text-[#ff375f] font-medium text-xs">Hard</span>;
    }
    return <span className="text-gray-400 font-medium text-xs">{difficulty}</span>;
  };

  const totalProblemsCount = problems.length;
  const solvedCount = solvedIdSet.size;
  const solvedPercentage =
    totalProblemsCount > 0
      ? Math.round((solvedCount / totalProblemsCount) * 100)
      : 0;

  // Breakdown counts
  const easyTotal = problems.filter((p) => p.difficulty?.toLowerCase() === "easy").length;
  const medTotal = problems.filter((p) => p.difficulty?.toLowerCase() === "medium").length;
  const hardTotal = problems.filter((p) => p.difficulty?.toLowerCase() === "hard").length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* 1. Header & Progress Summary Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#262626] rounded-xl border border-[#333333] p-5 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Problemset
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse and practice programming challenges across data structures and algorithms.
          </p>
        </div>

        {/* User Progress Stats */}
        {isAuthenticated ? (
          <div className="bg-[#1f1f1f] border border-[#333333] rounded-lg p-3.5 sm:min-w-[260px] shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Solved</span>
              <span className="font-semibold text-white">
                <span className="text-[#ffa116]">{solvedCount}</span> / {totalProblemsCount}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#333333] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ffa116] rounded-full transition-all duration-300"
                style={{ width: `${solvedPercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
              <span>
                Easy: <strong className="text-[#00b8a3]">{easyTotal}</strong>
              </span>
              <span>
                Med: <strong className="text-[#ffc01e]">{medTotal}</strong>
              </span>
              <span>
                Hard: <strong className="text-[#ff375f]">{hardTotal}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 max-w-xs">
            Sign in to track your solved problems, review submissions, and earn badges.
          </div>
        )}
      </div>

      {/* 2. Real-World Filter & Search Bar */}
      <div className="bg-[#262626] rounded-xl border border-[#333333] p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Switcher */}
          <div className="flex items-center bg-[#1e1e1e] p-1 rounded-lg border border-[#333333] text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => dispatch(setStatusFilter("all"))}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filters.status === "all"
                  ? "bg-[#2d2d2d] text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All Problems
            </button>
            <button
              type="button"
              disabled={!isAuthenticated}
              onClick={() => dispatch(setStatusFilter("solved"))}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                filters.status === "solved"
                  ? "bg-[#2d2d2d] text-[#00b8a3] shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
              title={!isAuthenticated ? "Log in to view solved problems" : ""}
            >
              Solved ({solvedCount})
            </button>
          </div>

          {/* Search & Dropdown Selects */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full h-8 pl-8 pr-3 text-xs bg-[#1e1e1e] border border-[#333333] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ffa116] transition-colors"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={filters.difficulty}
              onChange={(e) => dispatch(setDifficultyFilter(e.target.value))}
              className="h-8 px-2.5 text-xs bg-[#1e1e1e] border border-[#333333] rounded-md text-gray-300 focus:outline-none focus:border-[#ffa116] cursor-pointer"
              aria-label="Filter by difficulty"
            >
              <option value="all">Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Tags Filter */}
            <select
              value={filters.tag}
              onChange={(e) => dispatch(setTagFilter(e.target.value))}
              className="h-8 px-2.5 text-xs bg-[#1e1e1e] border border-[#333333] rounded-md text-gray-300 focus:outline-none focus:border-[#ffa116] max-w-[150px] truncate cursor-pointer"
              aria-label="Filter by tag"
            >
              <option value="all">Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            {(filters.status !== "all" ||
              filters.difficulty !== "all" ||
              filters.tag !== "all" ||
              filters.search !== "") && (
              <button
                type="button"
                onClick={() => dispatch(resetFilters())}
                className="h-8 px-2.5 rounded-md border border-[#333333] text-xs text-gray-400 hover:text-white hover:bg-[#2d2d2d] flex items-center gap-1 transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Problems List Table - Real-World LeetCode Table */}
      <div className="bg-[#262626] rounded-xl border border-[#333333] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#ffa116] border-t-transparent animate-spin"></div>
            <p className="text-xs text-gray-400">Loading problems...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center mx-auto text-gray-500">
              <Filter className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">No problems found</div>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              No problems match your current search or filters. Try resetting the criteria.
            </p>
            <button
              type="button"
              onClick={() => dispatch(resetFilters())}
              className="mt-2 px-3 py-1.5 rounded-md text-xs bg-[#1e1e1e] border border-[#333333] hover:bg-[#333333] text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#333333] bg-[#222222] text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-14 text-center">Status</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4 w-28">Difficulty</th>
                  <th className="py-3 px-4 hidden md:table-cell">Tags</th>
                  <th className="py-3 px-4 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]/70 text-xs">
                {filteredProblems.map((prob, index) => {
                  const isSolved = solvedIdSet.has(prob._id);
                  const problemNumber = index + 1;

                  return (
                    <tr
                      key={prob._id || index}
                      className="hover:bg-[#2e2e2e]/60 transition-colors group"
                    >
                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isSolved ? (
                          <span title="Solved" className="inline-flex text-[#2cbb5d]">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span title="Unsolved" className="inline-flex text-gray-600">
                            <Circle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4">
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
                          className="flex items-center gap-2 cursor-pointer group-hover:text-[#ffa116] transition-colors"
                        >
                          <span className="text-gray-400 font-mono text-[11px]">
                            {problemNumber}.
                          </span>
                          <span className="font-medium text-sm text-[#eff1f6] group-hover:text-[#ffa116] transition-colors">
                            {prob.title}
                          </span>
                        </div>
                      </td>

                      {/* Difficulty (Clean text, not loud badge) */}
                      <td className="py-3.5 px-4">
                        {renderDifficulty(prob.difficulty)}
                      </td>

                      {/* Tags */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(prob.tags) && prob.tags.length > 0 ? (
                            prob.tags.map((tag, tIndex) => (
                              <button
                                key={tIndex}
                                type="button"
                                onClick={() =>
                                  dispatch(
                                    setTagFilter(tag.toLowerCase().trim())
                                  )
                                }
                                className={`px-2 py-0.5 rounded-full text-[11px] transition-colors ${
                                  filters.tag.toLowerCase() ===
                                  tag.toLowerCase().trim()
                                    ? "bg-[#ffa116] text-[#1a1a1a] font-medium"
                                    : "bg-[#1f1f1f] text-gray-400 hover:text-white border border-[#333333]"
                                }`}
                              >
                                {tag}
                              </button>
                            ))
                          ) : (
                            <span className="text-gray-600 text-xs">--</span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectProblem &&
                            handleSelectProblem(prob._id || prob.id)
                          }
                          className="px-3 py-1 rounded-md text-xs font-medium text-gray-300 hover:text-white bg-[#1e1e1e] hover:bg-[#333333] border border-[#383838] transition-colors"
                        >
                          Solve
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
