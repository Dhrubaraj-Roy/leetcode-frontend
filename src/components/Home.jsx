import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Code2,
  Tag as TagIcon,
  Check,
} from "lucide-react";

export default function Home() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { problems, solvedProblems, isLoading, filters } = useSelector(
    (state) => state.problems
  );

  // 1. Hit the 2 APIs on component mount:
  // - API 1: GET /problem/all (Fetch all problems)
  // - API 2: GET /problem/solved (Fetch solved problems if authenticated)
  useEffect(() => {
    dispatch(getAllProblems());
    if (isAuthenticated) {
      dispatch(getSolvedProblems());
    }
  }, [dispatch, isAuthenticated]);

  // Create a fast lookup Set of solved problem IDs
  const solvedIdSet = useMemo(() => {
    return new Set(
      solvedProblems.map((p) =>
        typeof p === "string" ? p : p._id || p.id || ""
      )
    );
  }, [solvedProblems]);

  // Extract all unique tags dynamically from the problems list
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    problems.forEach((prob) => {
      if (Array.isArray(prob.tags)) {
        prob.tags.forEach((t) => tagSet.add(t.toLowerCase().trim()));
      }
    });
    return Array.from(tagSet).sort();
  }, [problems]);

  // Apply the 3 user filters (+ search)
  const filteredProblems = useMemo(() => {
    return problems.filter((prob) => {
      const isSolved = solvedIdSet.has(prob._id);

      // Filter 1: Status Filter ("all" vs "solved")
      if (filters.status === "solved" && !isSolved) {
        return false;
      }

      // Filter 2: Difficulty Filter ("all", "easy", "medium", "hard")
      if (
        filters.difficulty !== "all" &&
        prob.difficulty?.toLowerCase() !== filters.difficulty.toLowerCase()
      ) {
        return false;
      }

      // Filter 3: Tag Filter ("all" vs specific tag)
      if (filters.tag !== "all") {
        const hasTag = prob.tags?.some(
          (t) => t.toLowerCase().trim() === filters.tag.toLowerCase().trim()
        );
        if (!hasTag) return false;
      }

      // Search Query Filter
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

  // Difficulty badge styling helper
  const getDifficultyBadge = (difficulty) => {
    const diff = difficulty?.toLowerCase();
    if (diff === "easy") {
      return <span className="badge badge-success badge-sm font-semibold">Easy</span>;
    }
    if (diff === "medium") {
      return <span className="badge badge-warning badge-sm font-semibold">Medium</span>;
    }
    if (diff === "hard") {
      return <span className="badge badge-error badge-sm font-semibold">Hard</span>;
    }
    return <span className="badge badge-ghost badge-sm">{difficulty}</span>;
  };

  const totalProblemsCount = problems.length;
  const solvedCount = solvedIdSet.size;
  const solvedPercentage =
    totalProblemsCount > 0 ? Math.round((solvedCount / totalProblemsCount) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span>Explore Problems</span>
            <Sparkles className="w-6 h-6 text-warning" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Solve algorithmic problems, master data structures, and prepare for interviews.
          </p>
        </div>

        {/* User Progress Mini Card */}
        {isAuthenticated && (
          <div className="flex items-center gap-4 bg-base-200/60 p-4 rounded-xl border border-base-300 shrink-0">
            <div>
              <div className="text-xs text-base-content/70 font-medium">Solved Progress</div>
              <div className="text-xl font-bold flex items-baseline gap-1 mt-0.5">
                <span className="text-primary">{solvedCount}</span>
                <span className="text-sm text-base-content/50">/ {totalProblemsCount}</span>
              </div>
            </div>
            <div
              className="radial-progress text-primary font-bold text-xs"
              style={{
                "--value": solvedPercentage,
                "--size": "3rem",
                "--thickness": "4px",
              }}
              role="progressbar"
            >
              {solvedPercentage}%
            </div>
          </div>
        )}
      </div>

      {/* 2. Three Filters & Search Bar Section */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Filter 1: All Problems vs Solved Problems */}
            <div className="flex items-center">
              <div className="join w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => dispatch(setStatusFilter("all"))}
                  className={`join-item btn btn-sm sm:btn-md flex-1 sm:flex-initial ${
                    filters.status === "all" ? "btn-primary" : "btn-outline"
                  }`}
                >
                  All Problems ({totalProblemsCount})
                </button>
                <button
                  type="button"
                  disabled={!isAuthenticated}
                  onClick={() => dispatch(setStatusFilter("solved"))}
                  className={`join-item btn btn-sm sm:btn-md flex-1 sm:flex-initial ${
                    filters.status === "solved" ? "btn-primary" : "btn-outline"
                  }`}
                  title={!isAuthenticated ? "Log in to view solved problems" : ""}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Solved ({solvedCount})
                </button>
              </div>
            </div>

            {/* Filter 2 & 3: Difficulty & Tags + Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title or tag..."
                  value={filters.search}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  className="input input-sm sm:input-md input-bordered w-full pl-9"
                />
              </div>

              {/* Filter 2: Difficulty Filter */}
              <div className="form-control">
                <select
                  value={filters.difficulty}
                  onChange={(e) => dispatch(setDifficultyFilter(e.target.value))}
                  className="select select-sm sm:select-md select-bordered font-medium"
                  aria-label="Filter by difficulty"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Filter 3: Tags Filter */}
              <div className="form-control">
                <select
                  value={filters.tag}
                  onChange={(e) => dispatch(setTagFilter(e.target.value))}
                  className="select select-sm sm:select-md select-bordered font-medium max-w-[180px]"
                  aria-label="Filter by tag"
                >
                  <option value="all">All Tags</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters Button */}
              {(filters.status !== "all" ||
                filters.difficulty !== "all" ||
                filters.tag !== "all" ||
                filters.search !== "") && (
                <button
                  type="button"
                  onClick={() => dispatch(resetFilters())}
                  className="btn btn-sm sm:btn-md btn-ghost gap-1 text-base-content/70 hover:text-base-content"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Problems List / Table */}
      <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm text-base-content/60">Loading problems...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/40">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">No problems found</h3>
            <p className="text-sm text-base-content/60 max-w-md mx-auto">
              No problems match your current filters. Try resetting the filters or modifying your search query.
            </p>
            <button
              type="button"
              onClick={() => dispatch(resetFilters())}
              className="btn btn-sm btn-outline btn-primary mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              {/* Table Head */}
              <thead className="bg-base-200/60 text-xs font-semibold uppercase text-base-content/70">
                <tr>
                  <th className="w-16 text-center">Status</th>
                  <th>Title</th>
                  <th className="w-32">Difficulty</th>
                  <th>Tags</th>
                  <th className="w-28 text-right">Action</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-base-300">
                {filteredProblems.map((prob, index) => {
                  const isSolved = solvedIdSet.has(prob._id);
                  return (
                    <tr
                      key={prob._id || index}
                      className="hover:bg-base-200/40 transition-colors"
                    >
                      {/* Column 1: Status Icon */}
                      <td className="text-center">
                        {isSolved ? (
                          <div
                            className="tooltip tooltip-right"
                            data-tip="Solved"
                          >
                            <CheckCircle2 className="w-5 h-5 text-success inline-block" />
                          </div>
                        ) : (
                          <div
                            className="tooltip tooltip-right"
                            data-tip="Unsolved"
                          >
                            <Circle className="w-4 h-4 text-base-content/30 inline-block" />
                          </div>
                        )}
                      </td>

                      {/* Column 2: Problem Title */}
                      <td>
                        <div className="font-medium text-base hover:text-primary transition-colors cursor-pointer">
                          {prob.title}
                        </div>
                      </td>

                      {/* Column 3: Difficulty */}
                      <td>{getDifficultyBadge(prob.difficulty)}</td>

                      {/* Column 4: Tags */}
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(prob.tags) && prob.tags.length > 0 ? (
                            prob.tags.map((tag, tIndex) => (
                              <button
                                key={tIndex}
                                type="button"
                                onClick={() =>
                                  dispatch(setTagFilter(tag.toLowerCase().trim()))
                                }
                                className={`badge badge-sm cursor-pointer transition-colors ${
                                  filters.tag.toLowerCase() ===
                                  tag.toLowerCase().trim()
                                    ? "badge-primary"
                                    : "badge-ghost hover:badge-outline"
                                }`}
                              >
                                #{tag}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-base-content/40">
                              No tags
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Solve Action */}
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-xs sm:btn-sm btn-outline btn-primary"
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

