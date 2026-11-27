import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import ConfirmModal from "./ConfirmModal";
import ErrorBoundary from "./ErrorBoundary";
import {
  fetchProblemById,
  runCodeApi,
  submitCodeApi,
  waitForSubmissionResultApi,
  fetchProblemSubmissionsApi,
  fetchVideoByProblemId,
} from "../lib/api";
import { getSolvedProblems } from "../store/problemSlice";
import ChatInterface from "./ChatInterface";
import {
  ChevronLeft,
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
  Bot,
  Video,
  ExternalLink,
} from "lucide-react";

export default function ProblemDetail({
  problemId: propProblemId,
  onNavigateToHome,
  onNavigateToLogin,
}) {
  const params = useParams();
  const navigate = useNavigate();
  const problemId = propProblemId || params.id;
  const handleGoHome = onNavigateToHome || (() => navigate("/"));
  const handleGoLogin = onNavigateToLogin || (() => navigate("/login"));

  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Problem data state
  const [problem, setProblem] = useState(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [problemError, setProblemError] = useState(null);
  const [solutionVideo, setSolutionVideo] = useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Helper to format video duration
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Left panel active tab: "description" | "editorial" | "submissions" | "teacher"
  const [leftTab, setLeftTab] = useState("description");

  // Code editor state per language with persistence
  const [selectedLanguage, setSelectedLanguage] = useState("python"); // "python" | "cpp"
  const [code, setCode] = useState("");
  const [codeByLanguage, setCodeByLanguage] = useState({});

  const getDefaultTemplate = (lang) => {
    if (lang === "cpp") {
      return `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\n// Write your solution here\n`;
    }
    return `# Write your solution here\n`;
  };

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
  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState(0);
  const submitAbortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (submitAbortRef.current) {
        submitAbortRef.current.abort();
      }
    };
  }, [problemId]);

  // Fetch problem details on mount or problemId change with AbortController to prevent race conditions
  useEffect(() => {
    if (!problemId) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const loadProblem = async () => {
      try {
        setIsLoadingProblem(true);
        setProblemError(null);
        const data = await fetchProblemById(problemId, { signal });

        if (signal.aborted) return;

        if (data) {
          setProblem(data);

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

          // Fetch solution video if available
          setIsLoadingVideo(true);
          try {
            const vData = await fetchVideoByProblemId(problemId, { signal });
            if (!signal.aborted) setSolutionVideo(vData?.video || null);
          } catch (_) {
            if (!signal.aborted) setSolutionVideo(null);
          } finally {
            if (!signal.aborted) setIsLoadingVideo(false);
          }
        } else {
          if (!signal.aborted) setProblemError("Problem not found.");
        }
      } catch (err) {
        if (
          signal.aborted ||
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }
        setProblemError(
          err.userMessage ||
            err.response?.data?.message ||
            err.message ||
            "Failed to load problem."
        );
      } finally {
        if (!signal.aborted) setIsLoadingProblem(false);
      }
    };

    loadProblem();

    return () => {
      // Abort in-flight requests if problemId changes or component unmounts
      controller.abort();
    };
  }, [problemId]);

  // Fetch submissions history with AbortController when switching to submissions tab
  useEffect(() => {
    if (leftTab === "submissions" && isAuthenticated && problemId) {
      const controller = new AbortController();
      const signal = controller.signal;

      const loadSubmissions = async () => {
        try {
          setIsLoadingSubmissions(true);
          const data = await fetchProblemSubmissionsApi(problemId, { signal });
          if (!signal.aborted) {
            setSubmissionsList(data.submissions || []);
          }
        } catch (err) {
          if (
            signal.aborted ||
            err.name === "CanceledError" ||
            err.code === "ERR_CANCELED"
          ) {
            return;
          }
          setSubmissionsList([]);
        } finally {
          if (!signal.aborted) {
            setIsLoadingSubmissions(false);
          }
        }
      };

      loadSubmissions();

      return () => {
        controller.abort();
      };
    }
  }, [leftTab, isAuthenticated, problemId, submissionsRefreshKey]);

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

  const handleLanguageChange = (newLang) => {
    if (newLang === selectedLanguage) return;

    const currentEdited = code;
    const updatedMap = {
      ...codeByLanguage,
      [selectedLanguage]: currentEdited,
    };
    try {
      localStorage.setItem(`code_${problemId}_${selectedLanguage}`, currentEdited);
    } catch (_) {}

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

  const handleResetCode = () => {
    if (!problem) return;
    setIsResetModalOpen(true);
  };

  const executeResetCode = () => {
    if (!problem) return;
    const starter = getStarterCodeForLang(problem, selectedLanguage);
    setCode(starter);
    setCodeByLanguage((prev) => ({
      ...prev,
      [selectedLanguage]: starter,
    }));
    try {
      localStorage.removeItem(`code_${problemId}_${selectedLanguage}`);
    } catch (_) {}
    setIsResetModalOpen(false);
    toast.info(`Reset ${selectedLanguage.toUpperCase()} code to starter template.`);
  };

  const handleRunCode = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to run code.");
      return;
    }

    if (!code.trim()) {
      toast.warning("Please write some code before running.");
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

  const handleSubmitCode = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit your solution.");
      return;
    }

    if (!code.trim()) {
      toast.warning("Please write some code before submitting.");
      return;
    }

    if (submitAbortRef.current) {
      submitAbortRef.current.abort();
    }
    const controller = new AbortController();
    submitAbortRef.current = controller;

    setIsSubmitting(true);
    setActionError(null);
    setSubmissionResult(null);
    setRunResult(null);
    setConsoleTab("result");

    try {
      const data = await submitCodeApi(
        {
          problemId,
          language: selectedLanguage,
          code,
        },
        { signal: controller.signal }
      );

      let finalResult = data.submission || data;
      const initialStatus = finalResult?.status || data.status;
      const submissionId =
        data.submissionId || finalResult?.id || finalResult?._id;

      // Backend returns 202 Accepted with Pending/Queued while BullMQ evaluates in background
      if (
        submissionId &&
        (initialStatus === "Pending" || initialStatus === "Queued")
      ) {
        finalResult = await waitForSubmissionResultApi(submissionId, {
          signal: controller.signal,
        });
      }

      if (controller.signal.aborted) return;

      setSubmissionResult(finalResult);
      setSubmissionsRefreshKey((prev) => prev + 1);

      if (finalResult?.status === "Accepted") {
        dispatch(getSolvedProblems());
      }
    } catch (err) {
      if (
        controller.signal.aborted ||
        err.name === "AbortError" ||
        err.name === "CanceledError" ||
        err.code === "ERR_CANCELED"
      ) {
        return;
      }
      setActionError(
        err.userMessage ||
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to submit code."
      );
    } finally {
      if (submitAbortRef.current === controller) {
        submitAbortRef.current = null;
      }
      if (!controller.signal.aborted) {
        setIsSubmitting(false);
      }
    }
  };

  const renderDifficulty = (diff) => {
    const d = diff?.toLowerCase();
    if (d === "easy") {
      return <span className="text-easy font-medium text-xs">Easy</span>;
    }
    if (d === "medium") {
      return <span className="text-medium font-medium text-xs">Medium</span>;
    }
    return <span className="text-hard font-medium text-xs">Hard</span>;
  };

  if (isLoadingProblem) {
    return (
      <div className="h-screen bg-canvas flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>
        <p className="text-xs text-gray-400">Loading problem...</p>
      </div>
    );
  }

  if (problemError || !problem) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-panel rounded-xl border border-border text-center space-y-4">
          <div className="w-10 h-10 bg-rose-500/10 text-hard rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Problem not found</h2>
            <p className="text-xs text-gray-400 mt-1">
              {problemError || "The requested problem could not be located."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleGoHome}
            className="px-4 py-2 rounded-md bg-brand text-canvas text-xs font-semibold hover:bg-brand-hover transition-colors"
          >
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-canvas text-primary overflow-hidden">
      {/* Top IDE Command Bar - Real-World LeetCode Toolbar */}
      <header className="h-[46px] bg-panel border-b border-border px-3 sm:px-4 flex items-center justify-between shrink-0">
        {/* Left: Back to problem list + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleGoHome}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            title="Return to Problem List"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Problem List</span>
          </button>

          <span className="text-gray-600">|</span>

          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-white truncate max-w-[220px] sm:max-w-md">
              {problem.title}
            </span>
            {renderDifficulty(problem.difficulty)}
          </div>
        </div>

        {/* Center: Run & Submit Buttons (Authentic LeetCode styles) */}
        <div className="flex items-center gap-2">
          {/* Run Button: Dark Neutral Pill */}
          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-border hover:bg-panel-hover border border-border-subtle text-xs font-medium text-gray-200 transition-colors disabled:opacity-50"
            title="Run against visible test cases"
          >
            {isRunning ? (
              <div className="w-3 h-3 rounded-full border border-gray-300 border-t-transparent animate-spin"></div>
            ) : (
              <Play className="w-3.5 h-3.5 text-gray-300 fill-current" />
            )}
            <span>Run</span>
          </button>

          {/* Submit Button: Official LeetCode Emerald Green */}
          <button
            type="button"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded bg-easy hover:bg-easy-hover text-xs font-semibold text-white transition-colors disabled:opacity-50 shadow-xs"
            title="Submit solution for complete evaluation"
          >
            {isSubmitting ? (
              <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            <span>Submit</span>
          </button>
        </div>

        {/* Right: Auth info */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-4 h-4 rounded-full bg-brand text-canvas text-[10px] font-bold flex items-center justify-center">
                {(user.firstName || user.email || "U")[0].toUpperCase()}
              </div>
              <span className="truncate max-w-[100px]">
                {user.firstName || user.email}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoLogin}
              className="px-2.5 py-1 rounded text-xs text-brand hover:bg-brand/10 border border-brand/30 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Split Layout: Left Panel & Right Editor Panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 gap-2">
        {/* ===================== LEFT WORKBENCH PANEL ===================== */}
        <div className="w-full md:w-1/2 flex flex-col bg-panel rounded-lg border border-border overflow-hidden shadow-xs">
          {/* Left Panel Tabs Header */}
          <div className="flex items-center bg-panel-subtle border-b border-border px-2 pt-1 gap-1 shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setLeftTab("description")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition-colors border-b-2 ${
                leftTab === "description"
                  ? "bg-panel text-white border-brand font-semibold"
                  : "text-gray-400 hover:text-white border-transparent"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Description
            </button>

            <button
              type="button"
              onClick={() => setLeftTab("editorial")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition-colors border-b-2 ${
                leftTab === "editorial"
                  ? "bg-panel text-white border-brand font-semibold"
                  : "text-gray-400 hover:text-white border-transparent"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Editorial
              {solutionVideo && (
                <span className="text-[9px] font-bold px-1 rounded bg-brand/20 text-brand">
                  VIDEO
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLeftTab("submissions")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition-colors border-b-2 ${
                leftTab === "submissions"
                  ? "bg-panel text-white border-brand font-semibold"
                  : "text-gray-400 hover:text-white border-transparent"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Submissions
            </button>

            <button
              type="button"
              onClick={() => setLeftTab("teacher")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition-colors border-b-2 ${
                leftTab === "teacher"
                  ? "bg-panel text-brand border-brand font-semibold"
                  : "text-gray-400 hover:text-brand border-transparent"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              DSA Tutor
            </button>
          </div>

          {/* Left Panel Body: DSA Teacher Chat */}
          <div
            className={`flex-1 h-full overflow-hidden ${
              leftTab === "teacher" ? "flex flex-col" : "hidden"
            }`}
          >
            <ChatInterface
              problem={problem}
              currentCode={code}
              language={selectedLanguage}
              onNavigateToLogin={handleGoLogin}
            />
          </div>

          {/* Left Panel Body: Description, Editorial, and Submissions */}
          <div
            className={`flex-1 overflow-y-auto p-5 space-y-5 ${
              leftTab !== "teacher" ? "block" : "hidden"
            }`}
          >
            {/* 1. DESCRIPTION TAB */}
            {leftTab === "description" && (
              <div className="space-y-5">
                <div className="space-y-2 border-b border-border pb-4">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    {problem.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2">
                    {renderDifficulty(problem.difficulty)}

                    {Array.isArray(problem.tags) &&
                      problem.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-full text-[11px] text-gray-400 bg-panel-subtle border border-border"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Problem Description Content with Markdown & LaTeX Math Support */}
                <div className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="mb-3 leading-relaxed" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 mb-3 space-y-1 text-gray-300" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 mb-3 space-y-1 text-gray-300" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="leading-relaxed" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-white" {...props} />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic text-gray-200" {...props} />
                      ),
                      code: ({ node, inline, className, children, ...props }) => (
                        <code
                          className="px-1.5 py-0.5 rounded text-[12px] font-mono bg-panel-subtle border border-border text-brand"
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                      pre: ({ node, ...props }) => (
                        <pre
                          className="p-3 my-3 bg-panel-subtle border border-border rounded-lg overflow-x-auto font-mono text-xs text-gray-200"
                          {...props}
                        />
                      ),
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-3">
                          <table
                            className="w-full text-left border-collapse border border-border"
                            {...props}
                          />
                        </div>
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-white"
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          className="border border-border px-3 py-1.5 text-xs text-gray-300"
                          {...props}
                        />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-2 border-brand pl-3 py-1 my-2 text-gray-400 italic"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {problem.description}
                  </ReactMarkdown>
                </div>

                {/* Example Test Cases */}
                {Array.isArray(problem.visibleTestCases) &&
                  problem.visibleTestCases.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <h3 className="font-semibold text-xs text-gray-300 uppercase tracking-wider">
                        Examples
                      </h3>

                      {problem.visibleTestCases.map((tc, idx) => (
                        <div
                          key={idx}
                          className="bg-panel-subtle border border-border rounded-lg p-3 space-y-1.5 text-xs font-mono"
                        >
                          <div className="text-gray-400 font-sans font-semibold text-[11px]">
                            Example {idx + 1}:
                          </div>
                          <div>
                            <span className="text-gray-500 font-sans">Input: </span>
                            <span className="text-white">{tc.input}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 font-sans">Output: </span>
                            <span className="text-easy">{tc.output}</span>
                          </div>
                          {tc.explanation && (
                            <div className="text-gray-400 font-sans pt-1">
                              <span className="text-gray-500">Explanation: </span>
                              {tc.explanation}
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
                <div className="border-b border-border pb-3">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand" />
                    Editorial & Solution
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Algorithmic breakdown for {problem.title}.
                  </p>
                </div>

                {/* Solution Video Walkthrough Card */}
                <div className="bg-panel-subtle p-4 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-brand/10 text-brand flex items-center justify-center">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white">
                          Video Walkthrough
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          Official in-depth solution walkthrough
                        </p>
                      </div>
                    </div>

                    {solutionVideo && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {solutionVideo.duration > 0 && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3" />
                            {formatDuration(solutionVideo.duration)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isLoadingVideo ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
                      <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>
                      <p>Loading video walkthrough...</p>
                    </div>
                  ) : solutionVideo?.videoUrl ? (
                    <div className="space-y-2">
                      <div className="rounded-lg overflow-hidden bg-black aspect-video border border-border">
                        <video
                          key={solutionVideo.videoUrl}
                          controls
                          controlsList="nodownload"
                          poster={solutionVideo.thumbnailUrl}
                          src={solutionVideo.videoUrl}
                          className="w-full h-full object-contain"
                          preload="metadata"
                        >
                          Your browser does not support HTML5 video streaming.
                        </video>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                        <span>
                          {solutionVideo.format?.toUpperCase() || "MP4"}{" "}
                          {solutionVideo.bytes > 0 &&
                            `• ${(solutionVideo.bytes / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                        <a
                          href={solutionVideo.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline flex items-center gap-1"
                        >
                          Open in Tab <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-lg border border-dashed border-border text-center text-xs text-gray-500">
                      No video solution available for this problem yet.
                    </div>
                  )}
                </div>

                <div className="bg-panel-subtle p-4 rounded-lg border border-border space-y-1.5 text-xs">
                  <div className="font-semibold text-white">Intuition</div>
                  <p className="text-gray-300 leading-relaxed">
                    Identify the optimal data structures and time complexity based on problem constraints ({problem.tags?.join(", ") || "algorithm"}).
                  </p>
                </div>

                <div className="bg-panel-subtle p-4 rounded-lg border border-border space-y-1 text-xs">
                  <div className="font-semibold text-white">Complexity Analysis</div>
                  <p className="text-gray-300">
                    <strong>Time Complexity:</strong> Optimal time based on problem inputs.
                  </p>
                  <p className="text-gray-300">
                    <strong>Space Complexity:</strong> Auxiliary space for tracking state.
                  </p>
                </div>

                {Array.isArray(problem.referenceSolution) &&
                  problem.referenceSolution.length > 0 && (
                    <div className="bg-panel-subtle p-4 rounded-lg border border-border space-y-2 text-xs">
                      <div className="font-semibold text-white">
                        Reference Solution ({problem.referenceSolution[0].language})
                      </div>
                      <pre className="bg-canvas-subtle p-3 rounded border border-border-muted font-mono text-[11px] overflow-x-auto text-gray-200 leading-relaxed">
                        <code>{problem.referenceSolution[0].completeCode}</code>
                      </pre>
                    </div>
                  )}
              </div>
            )}

            {/* 3. SUBMISSIONS TAB */}
            {leftTab === "submissions" && (
              <div className="space-y-4">
                <div className="border-b border-border pb-3">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-brand" />
                    Submission History
                  </h2>
                  <p className="text-xs text-gray-400">
                    Past evaluations and runtime records.
                  </p>
                </div>

                {!isAuthenticated ? (
                  <div className="p-6 bg-panel-subtle rounded-lg text-center border border-border text-xs text-gray-400">
                    Sign in to track and view your submission history.
                  </div>
                ) : isLoadingSubmissions ? (
                  <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>
                    <span>Loading submissions...</span>
                  </div>
                ) : submissionsList.length === 0 ? (
                  <div className="p-8 text-center bg-panel-subtle rounded-lg border border-border text-xs text-gray-400 space-y-1">
                    <p>No submissions recorded yet.</p>
                    <p className="text-[11px] text-gray-500">
                      Write your solution and click Submit to benchmark against test cases.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded border border-border">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-panel-subtle border-b border-border text-[11px] text-gray-400">
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Language</th>
                          <th className="py-2.5 px-3">Runtime</th>
                          <th className="py-2.5 px-3">Memory</th>
                          <th className="py-2.5 px-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {submissionsList.map((sub, idx) => {
                          const isAcc = sub.status === "Accepted";
                          return (
                            <tr key={sub._id || idx} className="hover:bg-panel-hover/50">
                              <td className="py-2.5 px-3">
                                <span
                                  className={`font-semibold ${
                                    isAcc ? "text-easy" : "text-hard"
                                  }`}
                                >
                                  {sub.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 uppercase text-[11px] text-gray-300">
                                {sub.language}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-gray-300">
                                {sub.time || "--"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-gray-300">
                                {sub.memory || "--"}
                              </td>
                              <td className="py-2.5 px-3 text-right text-[11px] text-gray-400">
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

        {/* ===================== RIGHT WORKBENCH: MONACO & CONSOLE ===================== */}
        <div className="w-full md:w-1/2 flex flex-col bg-panel rounded-lg border border-border overflow-hidden shadow-xs">
          {/* Editor Header Bar */}
          <div className="h-10 bg-panel-subtle border-b border-border px-3 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-brand" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="h-7 px-2 bg-panel border border-border-subtle rounded text-xs text-gray-200 focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="python">Python3</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetCode}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-panel-hover transition-colors"
              title="Reset code template"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[320px] overflow-hidden bg-panel-subtle">
            <ErrorBoundary
              compact
              title="Code Editor Failed to Load"
              message="Monaco Editor could not be initialized. Please check your network connection or click Retry."
            >
              <Editor
                height="100%"
                language={selectedLanguage === "cpp" ? "cpp" : "python"}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                loading={
                  <div className="flex items-center justify-center h-full bg-panel-subtle text-gray-400 text-xs">
                    Loading code editor...
                  </div>
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'Fira Code', Menlo, Monaco, Consolas, monospace",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  padding: { top: 12, bottom: 12 },
                  lineNumbersMinChars: 3,
                  smoothScrolling: true,
                }}
              />
            </ErrorBoundary>
          </div>

          {/* Bottom Testcase & Test Result Drawer */}
          <div className="h-60 bg-panel border-t border-border flex flex-col shrink-0">
            {/* Drawer Tabs Bar */}
            <div className="flex items-center justify-between bg-panel-subtle border-b border-border px-3 h-8 shrink-0 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConsoleTab("testcase")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    consoleTab === "testcase"
                      ? "bg-panel text-white font-semibold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Testcase
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleTab("result")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    consoleTab === "result"
                      ? "bg-panel text-white font-semibold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Test Result
                </button>
              </div>

              {(isRunning || isSubmitting) && (
                <div className="flex items-center gap-1.5 text-xs text-brand">
                  <div className="w-3 h-3 rounded-full border border-brand border-t-transparent animate-spin"></div>
                  <span>{isRunning ? "Running..." : "Evaluating..."}</span>
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
                        className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                          activeTestCaseIndex === idx
                            ? "bg-border text-white font-semibold border border-border-subtle"
                            : "bg-panel-subtle text-gray-400 hover:bg-panel-hover border border-border"
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
                          <span className="text-[11px] text-gray-400 block mb-1">
                            Input:
                          </span>
                          <div className="bg-canvas p-2.5 rounded border border-border font-mono text-xs text-gray-200 whitespace-pre">
                            {problem.visibleTestCases[activeTestCaseIndex].input}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] text-gray-400 block mb-1">
                            Expected Output:
                          </span>
                          <div className="bg-canvas p-2.5 rounded border border-border font-mono text-xs text-easy whitespace-pre">
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
                    <div className="p-3 rounded bg-rose-500/10 border border-rose-500/25 text-hard text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{actionError}</span>
                    </div>
                  ) : isRunning || isSubmitting ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2 text-gray-400">
                      <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>
                      <p className="text-xs">Evaluating code against test cases...</p>
                    </div>
                  ) : submissionResult ? (
                    /* Final Submission Result View */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-base font-bold ${
                              submissionResult.status === "Accepted"
                                ? "text-easy"
                                : submissionResult.status === "Pending" ||
                                    submissionResult.status === "Queued"
                                  ? "text-medium"
                                  : "text-hard"
                            }`}
                          >
                            {submissionResult.status}
                          </span>
                          {submissionResult.status === "Accepted" ? (
                            <CheckCircle2 className="w-4 h-4 text-easy" />
                          ) : submissionResult.status === "Pending" ||
                            submissionResult.status === "Queued" ? (
                            <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 text-hard" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {submissionResult.time && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {submissionResult.time}
                            </span>
                          )}
                          {submissionResult.memory && (
                            <span className="flex items-center gap-1 font-mono">
                              <Cpu className="w-3 h-3 text-gray-400" />
                              {submissionResult.memory}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-300">
                        Testcases passed:{" "}
                        <strong className="text-white">
                          {submissionResult.testCasesPassed ?? 0} /{" "}
                          {submissionResult.totalTestCases ?? 0}
                        </strong>
                      </div>

                      {(submissionResult.errorMessage ||
                        submissionResult.compileOutput) && (
                        <div className="bg-rose-500/10 text-hard border border-rose-500/25 p-2.5 rounded text-xs whitespace-pre-wrap font-mono">
                          {submissionResult.errorMessage ||
                            submissionResult.compileOutput}
                        </div>
                      )}
                    </div>
                  ) : runResult ? (
                    /* Run Code Result View */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span
                          className={`text-base font-bold ${
                            runResult.status === "Accepted"
                              ? "text-easy"
                              : "text-hard"
                          }`}
                        >
                          {runResult.status}
                        </span>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {runResult.runtime && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {runResult.runtime}
                            </span>
                          )}
                          {runResult.memory && (
                            <span className="flex items-center gap-1 font-mono">
                              <Cpu className="w-3 h-3 text-gray-400" />
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
                              className="p-2.5 rounded bg-canvas border border-border space-y-1 font-mono text-xs"
                            >
                              <div className="flex items-center justify-between font-sans">
                                <span className="font-semibold text-gray-300">
                                  Case {res.testCase || rIdx + 1}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    res.passed ? "text-easy" : "text-hard"
                                  }`}
                                >
                                  {res.passed ? "Passed" : res.status || "Failed"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Input: </span>
                                {res.input}
                              </div>
                              <div>
                                <span className="text-gray-500">Output: </span>
                                <span className={res.passed ? "text-easy" : "text-hard"}>
                                  {res.actualOutput || "(No output)"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Expected: </span>
                                {res.expectedOutput}
                              </div>
                              {res.error && (
                                <div className="text-hard text-[11px] whitespace-pre-wrap mt-1">
                                  {res.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      Click <strong>Run</strong> to test example cases or <strong>Submit</strong> to evaluate all test cases.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Reset Code Confirmation Dialog */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset Code Template"
        message={`Are you sure you want to reset your ${selectedLanguage.toUpperCase()} code to the starter template? All of your unsaved edits in ${selectedLanguage.toUpperCase()} will be permanently lost.`}
        confirmText="Reset to Starter"
        cancelText="Cancel"
        variant="warning"
        onConfirm={executeResetCode}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
