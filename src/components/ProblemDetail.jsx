import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Editor from "@monaco-editor/react";
import {
  fetchProblemById,
  runCodeApi,
  submitCodeApi,
  fetchProblemSubmissionsApi,
} from "../lib/api";
import { getSolvedProblems } from "../store/problemSlice";
import ChatInterface from "./ChatInterface";
import {
  ArrowLeft,
  Play,
  CloudUpload,
  RotateCcw,
  Code2,
  FileText,
  BookOpen,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Cpu,
  Sparkles,
  ChevronRight,
  Bot,
} from "lucide-react";

export default function ProblemDetail({
  problemId,
  onNavigateToHome,
  onNavigateToLogin,
}) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Problem data state
  const [problem, setProblem] = useState(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [problemError, setProblemError] = useState(null);

  // Left panel active tab: "description" | "editorial" | "submissions" | "teacher"
  const [leftTab, setLeftTab] = useState("description");

  // Code editor state per language with persistence
  const [selectedLanguage, setSelectedLanguage] = useState("python"); // "python" | "cpp"
  const [code, setCode] = useState("");
  const [codeByLanguage, setCodeByLanguage] = useState({});

  // Default starter code templates for supported languages
  const getDefaultTemplate = (lang) => {
    if (lang === "cpp") {
      return `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\n// Write your solution here\n`;
    }
    return `# Write your solution here\n`;
  };

  // Helper to extract starter code from problem definition
  const getStarterCodeForLang = (problemObj, lang) => {
    if (problemObj && Array.isArray(problemObj.startCode)) {
      const targetLang = lang === "cpp" ? ["cpp", "c++"] : [lang];
      const match = problemObj.startCode.find((sc) =>
        targetLang.includes(sc.language?.toLowerCase())
      );
      if (match && match.initialCode) {
        return match.initialCode;
      }
    }
    return getDefaultTemplate(lang);
  };

  // Bottom console state: "testcase" | "result"
  const [consoleTab, setConsoleTab] = useState("testcase");
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);

  // Run / Submit execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Submissions list state
  const [submissionsList, setSubmissionsList] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // 1. Fetch problem details on mount or problemId change
  useEffect(() => {
    let isMounted = true;

    const loadProblem = async () => {
      try {
        setIsLoadingProblem(true);
        setProblemError(null);
        const data = await fetchProblemById(problemId);

        if (!isMounted) return;

        if (data) {
          setProblem(data);

          // Build code map across languages: load user's previously saved code or fallback to problem starter code
          const initialMap = {};
          const supportedLangs = ["python", "cpp"];

          supportedLangs.forEach((lang) => {
            try {
              const saved = localStorage.getItem(`code_${problemId}_${lang}`);
              if (saved !== null && saved !== "") {
                initialMap[lang] = saved;
                return;
              }
            } catch (_) {}
            initialMap[lang] = getStarterCodeForLang(data, lang);
          });

          // Also scan any additional languages in problem.startCode
          if (Array.isArray(data.startCode)) {
            data.startCode.forEach((sc) => {
              const langKey =
                sc.language?.toLowerCase() === "c++"
                  ? "cpp"
                  : sc.language?.toLowerCase();
              if (langKey && !initialMap[langKey]) {
                try {
                  const saved = localStorage.getItem(`code_${problemId}_${langKey}`);
                  if (saved !== null && saved !== "") {
                    initialMap[langKey] = saved;
                    return;
                  }
                } catch (_) {}
                initialMap[langKey] = sc.initialCode || getDefaultTemplate(langKey);
              }
            });
          }

          const defaultLang = "python";
          setSelectedLanguage(defaultLang);
          setCode(initialMap[defaultLang] || getDefaultTemplate(defaultLang));
          setCodeByLanguage(initialMap);
        } else {
          setProblemError("Problem not found.");
        }
      } catch (err) {
        if (!isMounted) return;
        setProblemError(
          err.response?.data?.message || err.message || "Failed to load problem."
        );
      } finally {
        if (isMounted) setIsLoadingProblem(false);
      }
    };

    if (problemId) {
      loadProblem();
    }

    return () => {
      isMounted = false;
    };
  }, [problemId]);

  // 2. Fetch submissions history when switching to "submissions" tab
  useEffect(() => {
    if (leftTab === "submissions" && isAuthenticated && problemId) {
      const loadSubmissions = async () => {
        try {
          setIsLoadingSubmissions(true);
          const data = await fetchProblemSubmissionsApi(problemId);
          setSubmissionsList(data.submissions || []);
        } catch (_) {
          setSubmissionsList([]);
        } finally {
          setIsLoadingSubmissions(false);
        }
      };

      loadSubmissions();
    }
  }, [leftTab, isAuthenticated, problemId]);

  // Handle editor code modifications: updates active code, per-language map, and localStorage
  const handleCodeChange = (newVal) => {
    const val = newVal ?? "";
    setCode(val);
    setCodeByLanguage((prev) => ({
      ...prev,
      [selectedLanguage]: val,
    }));
    try {
      localStorage.setItem(`code_${problemId}_${selectedLanguage}`, val);
    } catch (_) {}
  };

  // Handle switching language in editor without losing edits in any language
  const handleLanguageChange = (newLang) => {
    if (newLang === selectedLanguage) return;

    // 1. Save current language's edited code
    const currentEdited = code;
    const updatedMap = {
      ...codeByLanguage,
      [selectedLanguage]: currentEdited,
    };
    try {
      localStorage.setItem(`code_${problemId}_${selectedLanguage}`, currentEdited);
    } catch (_) {}

    // 2. Load target code for new language from state, localStorage, or starter code
    let targetCode = updatedMap[newLang];
    if (targetCode === undefined) {
      try {
        const saved = localStorage.getItem(`code_${problemId}_${newLang}`);
        if (saved !== null && saved !== "") {
          targetCode = saved;
        }
      } catch (_) {}
    }

    if (targetCode === undefined) {
      targetCode = getStarterCodeForLang(problem, newLang);
    }

    updatedMap[newLang] = targetCode;
    setCodeByLanguage(updatedMap);
    setSelectedLanguage(newLang);
    setCode(targetCode);
  };

  // Reset only current language code to starter template
  const handleResetCode = () => {
    if (!problem) return;
    const confirmReset = window.confirm(
      `Reset your ${selectedLanguage.toUpperCase()} code to the default starter template? Current edits in ${selectedLanguage.toUpperCase()} will be discarded.`
    );
    if (!confirmReset) return;

    const starter = getStarterCodeForLang(problem, selectedLanguage);
    setCode(starter);
    setCodeByLanguage((prev) => ({
      ...prev,
      [selectedLanguage]: starter,
    }));
    try {
      localStorage.removeItem(`code_${problemId}_${selectedLanguage}`);
    } catch (_) {}
  };

  // Execute "Run Code" against visible test cases
  const handleRunCode = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to run and evaluate your code.");
      return;
    }

    if (!code.trim()) {
      alert("Please write some code before running.");
      return;
    }

    setIsRunning(true);
    setActionError(null);
    setRunResult(null);
    setSubmissionResult(null);
    setConsoleTab("result");

    try {
      const data = await runCodeApi({
        problemId,
        language: selectedLanguage,
        code,
      });
      setRunResult(data);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to run code."
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Execute "Submit" against all test cases (visible + hidden)
  const handleSubmitCode = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to submit your solution.");
      return;
    }

    if (!code.trim()) {
      alert("Please write some code before submitting.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSubmissionResult(null);
    setRunResult(null);
    setConsoleTab("result");

    try {
      const data = await submitCodeApi({
        problemId,
        language: selectedLanguage,
        code,
      });

      setSubmissionResult(data.submission || data);

      // If solution is accepted, refresh solved problems in Redux store
      if (
        data.submission?.status === "Accepted" ||
        data.status === "Accepted"
      ) {
        dispatch(getSolvedProblems());
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to submit code."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Difficulty badge helper
  const getDifficultyBadge = (diff) => {
    const d = diff?.toLowerCase();
    if (d === "easy") {
      return (
        <span className="badge badge-success badge-sm font-semibold text-success-content">
          Easy
        </span>
      );
    }
    if (d === "medium") {
      return (
        <span className="badge badge-warning badge-sm font-semibold text-warning-content">
          Medium
        </span>
      );
    }
    return (
      <span className="badge badge-error badge-sm font-semibold text-error-content">
        Hard
      </span>
    );
  };

  if (isLoadingProblem) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm text-base-content/60 mt-3">Loading problem...</p>
      </div>
    );
  }

  if (problemError || !problem) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-base-100 rounded-2xl shadow-xl border border-error/20 text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-base-content mb-2">
          Unable to Load Problem
        </h2>
        <p className="text-sm text-base-content/70 mb-6">
          {problemError || "The requested problem does not exist."}
        </p>
        <button
          type="button"
          onClick={onNavigateToHome}
          className="btn btn-primary btn-sm"
        >
          Back to Problem List
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-base-300 text-base-content overflow-hidden">
      {/* Top Action Header Bar */}
      <div className="h-12 bg-base-100 border-b border-base-300 px-4 flex items-center justify-between shrink-0">
        {/* Left: Navigation back to problem list */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="flex items-center gap-2 font-bold text-sm hover:text-primary transition-colors mr-2 cursor-pointer"
            title="Return to problem list"
          >
            <Code2 className="w-5 h-5 text-primary" />
            <span className="font-bold hidden sm:inline">LeetCode</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToHome}
            className="btn btn-ghost btn-xs gap-1 font-semibold text-base-content/80 hover:text-base-content"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Problem List
          </button>
        </div>

        {/* Center: Run & Submit Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="btn btn-ghost btn-xs border border-base-300 gap-1.5 font-medium hover:bg-base-200"
            title="Run code against visible example test cases"
          >
            {isRunning ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Play className="w-3.5 h-3.5 text-info fill-info" />
            )}
            Run
          </button>

          <button
            type="button"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="btn btn-success btn-xs gap-1.5 font-semibold text-success-content"
            title="Submit solution for complete evaluation"
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            Submit
          </button>
        </div>

        {/* Right: Auth status info (strictly no settings or notification buttons) */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <span className="text-xs font-mono text-base-content/70">
              {user.firstName || user.emailId || user.email}
            </span>
          ) : (
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="btn btn-primary btn-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Left Panel & Right Editor Panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 gap-2">
        {/* ===================== LEFT PANEL ===================== */}
        <div className="w-full md:w-1/2 flex flex-col bg-base-100 rounded-xl border border-base-300 overflow-hidden shadow-sm">
          {/* Left Panel Tabs Header */}
          <div className="flex items-center bg-base-200/60 border-b border-base-300 px-3 pt-2 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setLeftTab("description")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
                leftTab === "description"
                  ? "bg-base-100 text-primary border-t-2 border-primary"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Description
            </button>

            <button
              type="button"
              onClick={() => setLeftTab("editorial")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
                leftTab === "editorial"
                  ? "bg-base-100 text-primary border-t-2 border-primary"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Editorial
            </button>

            <button
              type="button"
              onClick={() => setLeftTab("submissions")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
                leftTab === "submissions"
                  ? "bg-base-100 text-primary border-t-2 border-primary"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Submissions
            </button>

            <button
              type="button"
              onClick={() => setLeftTab("teacher")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
                leftTab === "teacher"
                  ? "bg-base-100 text-primary border-t-2 border-primary"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-primary" />
              DSA Teacher
            </button>
          </div>

          {/* Left Panel Body: DSA Teacher Chat (stays mounted, preserves conversation & scroll) */}
          <div
            className={`flex-1 h-full overflow-hidden ${
              leftTab === "teacher" ? "flex flex-col" : "hidden"
            }`}
          >
            <ChatInterface
              problem={problem}
              currentCode={code}
              language={selectedLanguage}
              onNavigateToLogin={onNavigateToLogin}
            />
          </div>

          {/* Left Panel Body: Description, Editorial, and Submissions */}
          <div
            className={`flex-1 overflow-y-auto p-5 space-y-6 ${
              leftTab !== "teacher" ? "block" : "hidden"
            }`}
          >
              {/* 1. DESCRIPTION TAB */}
              {leftTab === "description" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-base-content">
                    {problem.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {getDifficultyBadge(problem.difficulty)}

                    {Array.isArray(problem.tags) &&
                      problem.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="badge badge-ghost badge-sm text-xs font-medium text-base-content/70"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Problem Description Content */}
                <div className="prose prose-sm max-w-none text-base-content/90 whitespace-pre-line leading-relaxed">
                  {problem.description}
                </div>

                {/* Example Test Cases */}
                {Array.isArray(problem.visibleTestCases) &&
                  problem.visibleTestCases.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-base-300">
                      <h3 className="font-bold text-sm text-base-content">
                        Examples
                      </h3>

                      {problem.visibleTestCases.map((tc, idx) => (
                        <div
                          key={idx}
                          className="bg-base-200/50 border border-base-300 rounded-lg p-3 space-y-2 text-xs font-mono"
                        >
                          <div className="font-semibold text-base-content/70 font-sans">
                            Example {idx + 1}:
                          </div>
                          <div>
                            <span className="font-bold text-base-content/80 font-sans">
                              Input:{" "}
                            </span>
                            <span className="text-base-content">{tc.input}</span>
                          </div>
                          <div>
                            <span className="font-bold text-base-content/80 font-sans">
                              Output:{" "}
                            </span>
                            <span className="text-base-content">{tc.output}</span>
                          </div>
                          {tc.explanation && (
                            <div>
                              <span className="font-bold text-base-content/80 font-sans">
                                Explanation:{" "}
                              </span>
                              <span className="text-base-content/70 font-sans">
                                {tc.explanation}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* 2. EDITORIAL TAB */}
            {leftTab === "editorial" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Editorial & Solution Approach
                  </h2>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Algorithmic breakdown and complexity analysis for{" "}
                    <strong>{problem.title}</strong>.
                  </p>
                </div>

                <div className="bg-base-200/40 p-4 rounded-xl border border-base-300 space-y-3 text-sm">
                  <h3 className="font-bold text-base-content text-sm">
                    1. Problem Overview & Intuition
                  </h3>
                  <p className="text-base-content/80 leading-relaxed text-xs">
                    This problem tests foundational problem-solving patterns.
                    Analyze constraints and identify the optimal data structure
                    based on the problem tags (
                    {problem.tags?.join(", ") || "algorithm"}).
                  </p>
                </div>

                <div className="bg-base-200/40 p-4 rounded-xl border border-base-300 space-y-3 text-sm">
                  <h3 className="font-bold text-base-content text-sm">
                    2. Algorithmic Steps
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-base-content/80">
                    <li>Read and validate input constraints.</li>
                    <li>
                      Initialize auxiliary data structures to track state or
                      frequency.
                    </li>
                    <li>
                      Iterate through inputs while maintaining invariants.
                    </li>
                    <li>
                      Return the computed result matching expected formatting.
                    </li>
                  </ul>
                </div>

                <div className="bg-base-200/40 p-4 rounded-xl border border-base-300 space-y-2 text-xs">
                  <h3 className="font-bold text-base-content">
                    3. Complexity Analysis
                  </h3>
                  <p className="text-base-content/80">
                    <strong>Time Complexity:</strong> Optimal linear or
                    log-linear time based on input size.
                  </p>
                  <p className="text-base-content/80">
                    <strong>Space Complexity:</strong> Auxiliary space scaling
                    with unique elements or state stack.
                  </p>
                </div>

                {Array.isArray(problem.referenceSolution) &&
                  problem.referenceSolution.length > 0 && (
                    <div className="bg-base-200/40 p-4 rounded-xl border border-base-300 space-y-2 text-xs">
                      <h3 className="font-bold text-base-content">
                        4. Reference Solution ({problem.referenceSolution[0].language})
                      </h3>
                      <pre className="bg-base-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto text-base-content/90 leading-normal">
                        <code>{problem.referenceSolution[0].completeCode}</code>
                      </pre>
                    </div>
                  )}
              </div>
            )}

            {/* 3. SUBMISSIONS TAB */}
            {leftTab === "submissions" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Submission History
                  </h2>
                  <p className="text-xs text-base-content/60">
                    Review your past submissions and performance metrics for
                    this challenge.
                  </p>
                </div>

                {!isAuthenticated ? (
                  <div className="p-6 bg-base-200/50 rounded-xl text-center border border-base-300 space-y-2">
                    <p className="text-xs text-base-content/70">
                      Please sign in to view and save your submission history.
                    </p>
                  </div>
                ) : isLoadingSubmissions ? (
                  <div className="p-8 text-center">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                    <p className="text-xs text-base-content/60 mt-2">
                      Loading submissions...
                    </p>
                  </div>
                ) : submissionsList.length === 0 ? (
                  <div className="p-8 text-center bg-base-200/40 rounded-xl border border-base-300 space-y-2">
                    <Code2 className="w-8 h-8 mx-auto text-base-content/30" />
                    <p className="text-xs text-base-content/60">
                      No submissions recorded yet. Write your code and click{" "}
                      <strong>Submit</strong>!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-xs w-full">
                      <thead>
                        <tr className="bg-base-200/60 text-base-content/70">
                          <th>Status</th>
                          <th>Language</th>
                          <th>Runtime</th>
                          <th>Memory</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionsList.map((sub, idx) => {
                          const isAcc = sub.status === "Accepted";
                          return (
                            <tr key={sub._id || idx} className="hover:bg-base-200/40">
                              <td>
                                <span
                                  className={`badge badge-xs font-semibold ${
                                    isAcc
                                      ? "badge-success text-success-content"
                                      : "badge-error text-error-content"
                                  }`}
                                >
                                  {sub.status}
                                </span>
                              </td>
                              <td className="font-mono text-[11px] uppercase">
                                {sub.language}
                              </td>
                              <td className="font-mono text-[11px]">
                                {sub.time || "N/A"}
                              </td>
                              <td className="font-mono text-[11px]">
                                {sub.memory || "N/A"}
                              </td>
                              <td className="text-[11px] text-base-content/60">
                                {sub.createdAt
                                  ? new Date(sub.createdAt).toLocaleDateString()
                                  : "Recently"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===================== RIGHT PANEL: CODE EDITOR & TESTCASES ===================== */}
        <div className="w-full md:w-1/2 flex flex-col bg-base-100 rounded-xl border border-base-300 overflow-hidden shadow-sm">
          {/* Editor Header Bar */}
          <div className="h-10 bg-base-200/60 border-b border-base-300 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="select select-bordered select-xs font-mono font-medium"
              >
                <option value="python">Python3</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetCode}
              className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content gap-1"
              title="Reset code to starter template"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Code
            </button>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[300px] overflow-hidden">
            <Editor
              height="100%"
              language={selectedLanguage === "cpp" ? "cpp" : "python"}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              loading={
                <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-base-content/60 text-xs font-mono">
                  <span className="loading loading-spinner loading-sm mr-2 text-primary"></span>
                  Loading Code Editor...
                </div>
              }
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 12 },
                lineNumbersMinChars: 3,
              }}
            />
          </div>

          {/* Bottom Testcase & Test Result Drawer (Height ~200px) */}
          <div className="h-60 bg-base-100 border-t border-base-300 flex flex-col shrink-0">
            {/* Drawer Tabs */}
            <div className="flex items-center justify-between bg-base-200/50 border-b border-base-300 px-3 h-8 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConsoleTab("testcase")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    consoleTab === "testcase"
                      ? "bg-base-100 text-primary"
                      : "text-base-content/60 hover:text-base-content"
                  }`}
                >
                  Testcase
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleTab("result")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    consoleTab === "result"
                      ? "bg-base-100 text-primary"
                      : "text-base-content/60 hover:text-base-content"
                  }`}
                >
                  Test Result
                </button>
              </div>

              {(isRunning || isSubmitting) && (
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <span className="loading loading-spinner loading-xs"></span>
                  {isRunning ? "Executing..." : "Evaluating..."}
                </div>
              )}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-3 text-xs">
              {/* TAB 1: TESTCASE VIEWER */}
              {consoleTab === "testcase" && (
                <div className="space-y-3">
                  {/* Case Pill Selector */}
                  <div className="flex items-center gap-1.5">
                    {problem.visibleTestCases?.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveTestCaseIndex(idx)}
                        className={`btn btn-xs ${
                          activeTestCaseIndex === idx
                            ? "btn-primary font-bold"
                            : "btn-ghost"
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Active Case Details */}
                  {problem.visibleTestCases &&
                    problem.visibleTestCases[activeTestCaseIndex] && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-[11px] font-semibold text-base-content/60 block mb-0.5">
                            Input:
                          </span>
                          <div className="bg-base-200 p-2 rounded font-mono text-xs text-base-content whitespace-pre">
                            {problem.visibleTestCases[activeTestCaseIndex].input}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-base-content/60 block mb-0.5">
                            Expected Output:
                          </span>
                          <div className="bg-base-200 p-2 rounded font-mono text-xs text-base-content whitespace-pre">
                            {problem.visibleTestCases[activeTestCaseIndex].output}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* TAB 2: TEST RESULT */}
              {consoleTab === "result" && (
                <div className="space-y-3">
                  {actionError ? (
                    <div className="alert alert-error text-xs p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{actionError}</span>
                    </div>
                  ) : isRunning || isSubmitting ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2">
                      <span className="loading loading-spinner loading-md text-primary"></span>
                      <p className="text-xs text-base-content/60 font-mono">
                        Running code against test cases on Judge0...
                      </p>
                    </div>
                  ) : submissionResult ? (
                    /* Final Submission Result View */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-base-300 pb-2">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-base font-bold ${
                              submissionResult.status === "Accepted"
                                ? "text-success"
                                : "text-error"
                            }`}
                          >
                            {submissionResult.status}
                          </h3>
                          {submissionResult.status === "Accepted" ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-error" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono text-base-content/70">
                          {submissionResult.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {submissionResult.time}
                            </span>
                          )}
                          {submissionResult.memory && (
                            <span className="flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" />
                              {submissionResult.memory}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-base-content/80 font-mono">
                        Test Cases Passed:{" "}
                        <span className="font-bold">
                          {submissionResult.testCasesPassed ?? 0} /{" "}
                          {submissionResult.totalTestCases ?? 0}
                        </span>
                      </div>

                      {submissionResult.errorMessage && (
                        <div className="bg-error/10 text-error p-2 rounded font-mono text-xs whitespace-pre-wrap">
                          {submissionResult.errorMessage}
                        </div>
                      )}
                    </div>
                  ) : runResult ? (
                    /* Run Code Result View */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-base-300 pb-2">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-base font-bold ${
                              runResult.status === "Accepted"
                                ? "text-success"
                                : "text-error"
                            }`}
                          >
                            {runResult.status}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono text-base-content/70">
                          {runResult.runtime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {runResult.runtime}
                            </span>
                          )}
                          {runResult.memory && (
                            <span className="flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" />
                              {runResult.memory}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Run Test Case Breakdown */}
                      {Array.isArray(runResult.results) && (
                        <div className="space-y-2">
                          {runResult.results.map((res, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-2.5 rounded bg-base-200 border border-base-300 space-y-1 font-mono text-xs"
                            >
                              <div className="flex items-center justify-between font-sans">
                                <span className="font-semibold text-base-content/80">
                                  Case {res.testCase || rIdx + 1}
                                </span>
                                <span
                                  className={`badge badge-xs ${
                                    res.passed ? "badge-success" : "badge-error"
                                  }`}
                                >
                                  {res.passed ? "Passed" : res.status || "Failed"}
                                </span>
                              </div>
                              <div>
                                <span className="text-base-content/50">
                                  Input:{" "}
                                </span>
                                {res.input}
                              </div>
                              <div>
                                <span className="text-base-content/50">
                                  Output:{" "}
                                </span>
                                <span
                                  className={
                                    res.passed ? "text-success" : "text-error"
                                  }
                                >
                                  {res.actualOutput || "(No output)"}
                                </span>
                              </div>
                              <div>
                                <span className="text-base-content/50">
                                  Expected:{" "}
                                </span>
                                {res.expectedOutput}
                              </div>
                              {res.error && (
                                <div className="text-error text-[11px] whitespace-pre-wrap mt-1">
                                  {res.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-base-content/50">
                      Click <strong>Run</strong> to test example cases or{" "}
                      <strong>Submit</strong> to evaluate all test cases.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
