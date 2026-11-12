import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Send,
  Bot,
  User,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Lock,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import { sendChatMessageApi } from "../lib/api";
import {
  addChatMessage,
  setChatMessages,
  clearChatConversation,
} from "../store/chatSlice";
import { copyToClipboard } from "../lib/clipboard";
import FormattedMessage from "./FormattedMessage";

export default function ChatInterface({
  problem = null,
  currentCode = "",
  language = "",
  onClose = null,
  onNavigateToLogin = null,
}) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Channel ID for conversation persistence: problem-specific or global
  const channelId = problem?._id || problem?.id || "global";
  const rawChannelMessages = useSelector(
    (state) => state.chat.conversations[channelId]
  );

  // Track copied message state for full message copy button
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Initial greeting tailored to authentication status and active problem context
  const getInitialMessage = () => {
    if (!isAuthenticated) {
      return "Halt! You are not signed in. The DSA Teacher only speaks to registered, authenticated students with valid accounts. Please log in before asking questions.";
    }
    const studentName = user?.firstName ? user.firstName : "student";
    if (problem?.title) {
      return `Listen up, ${studentName}! I am your DSA Teacher. I see you're working on "${problem.title}". Ask me about the optimal algorithm, time complexity, or your code. Don't waste my time with sloppy thinking or brute-force garbage!`;
    }
    return `Listen up, ${studentName}! I am your DSA Teacher. Ask me any question on Data Structures, Algorithms, or your code. Don't waste my time with lazy questions!`;
  };

  // If this channel has no messages yet in Redux, initialize it
  useEffect(() => {
    if (!rawChannelMessages || rawChannelMessages.length === 0) {
      dispatch(
        setChatMessages({
          channelId,
          messages: [
            {
              id: `welcome-${channelId}`,
              role: "teacher",
              text: getInitialMessage(),
              timestamp: "Just now",
            },
          ],
        })
      );
    }
  }, [channelId, isAuthenticated]);

  const messages =
    rawChannelMessages && rawChannelMessages.length > 0
      ? rawChannelMessages
      : [
          {
            id: `welcome-${channelId}`,
            role: "teacher",
            text: getInitialMessage(),
            timestamp: "Just now",
          },
        ];

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Requirement: useRef hook for latest chat
  // This ref is attached to an anchor at the bottom of the chat stream to auto-scroll down smoothly
  const latestChatRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message whenever messages change or typing begins
  useEffect(() => {
    latestChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus the input field on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      inputRef.current?.focus();
    }
  }, [isAuthenticated]);

  // Handle one-click copy of the entire message text
  const handleCopyMessage = async (msgId, text) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  // Context-aware quick suggestion chips
  const quickPrompts = problem?.title
    ? [
        "What is the optimal time complexity for this?",
        "Can you review my current code?",
        "Give me an algorithmic hint without full solution",
        "What edge cases should I test for this problem?",
      ]
    : [
        "Explain time complexity and Big-O",
        "How does binary search work?",
        "Difference between Stack and Queue",
        "Dynamic programming intuition",
        "Two Pointers pattern",
      ];

  const handleSendMessage = async (customText = null) => {
    const textToSend = (typeof customText === "string" ? customText : input).trim();
    if (!textToSend || isTyping) return;

    if (!isAuthenticated) {
      const authNotice = {
        id: `auth-notice-${Date.now()}`,
        role: "teacher",
        text: "You are not authenticated! Please log in to your account to use the AI chatbot.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      dispatch(addChatMessage({ channelId, message: authNotice }));
      return;
    }

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    dispatch(addChatMessage({ channelId, message: userMsg }));
    setInput("");
    setIsTyping(true);

    try {
      // Send chat message with active problem context & Monaco editor code
      const apiResponse = await sendChatMessageApi({
        message: textToSend,
        history: messages.map((m) => ({
          role: m.role === "teacher" ? "assistant" : "user",
          content: m.text,
        })),
        problemId: problem?._id || problem?.id || null,
        problemTitle: problem?.title || null,
        problemDescription: problem?.description || null,
        currentCode: currentCode || null,
        language: language || null,
      });

      const replyText =
        apiResponse?.reply ||
        apiResponse?.message ||
        "No response from DSA teacher.";

      const teacherMsg = {
        id: `teacher-${Date.now()}`,
        role: "teacher",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      dispatch(addChatMessage({ channelId, message: teacherMsg }));
    } catch (err) {
      const status = err.response?.status;
      let errorText = "Could not send message. Please check your network and try again.";

      if (status === 401) {
        errorText = "Authentication required (401). You must be signed in with a valid account to use the AI chatbot.";
      } else if (err.response?.data?.message) {
        errorText = `Error: ${err.response.data.message}`;
      }

      const errorMsg = {
        id: `error-${Date.now()}`,
        role: "teacher",
        text: errorText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      dispatch(addChatMessage({ channelId, message: errorMsg }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    dispatch(
      setChatMessages({
        channelId,
        messages: [
          {
            id: `reset-${Date.now()}`,
            role: "teacher",
            text: getInitialMessage(),
            timestamp: "Just now",
          },
        ],
      })
    );
  };

  return (
    <div className="flex flex-col h-full bg-base-100 text-base-content overflow-hidden select-text">
      {/* Top Header Bar */}
      <div className="h-11 bg-base-200/70 border-b border-base-300 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30 shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold flex items-center gap-1.5 leading-tight">
              <span>DSA Teacher</span>
              <span
                className={`badge badge-xs py-0.5 px-1 text-[9px] font-semibold ${
                  isAuthenticated
                    ? "badge-success text-success-content"
                    : "badge-warning text-warning-content"
                }`}
              >
                {isAuthenticated ? "Online" : "Sign In Required"}
              </span>
            </div>
            <div className="text-[10px] text-base-content/60 leading-tight truncate">
              {problem?.title ? `Problem: ${problem.title}` : "Data Structures & Algorithms"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleResetChat}
            className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content gap-1"
            title="Clear Chat Conversation"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline text-[11px]">Clear</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
              title="Close Chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area using daisyUI Chat Layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => {
          const isTeacher = msg.role === "teacher";

          return (
            <div
              key={msg.id}
              className={`chat ${isTeacher ? "chat-start" : "chat-end"}`}
            >
              {/* Chat Avatar */}
              <div className="chat-image avatar">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                    isTeacher
                      ? "bg-primary text-primary-content"
                      : "bg-secondary text-secondary-content"
                  }`}
                >
                  {isTeacher ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Chat Header with One-Click Copy */}
              <div className="chat-header text-[11px] text-base-content/70 mb-1 flex items-center gap-2">
                <span className="font-semibold text-base-content">
                  {isTeacher ? "DSA Teacher" : "You"}
                </span>
                <time className="text-[10px] opacity-60">{msg.timestamp}</time>

                <button
                  type="button"
                  onClick={() => handleCopyMessage(msg.id, msg.text)}
                  className="btn btn-ghost btn-xs h-5 px-1 text-[10px] gap-1 opacity-60 hover:opacity-100 transition-opacity ml-1"
                  title="Copy entire message text"
                >
                  {copiedMessageId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span className="text-success text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* DaisyUI Chat Bubble with Rich Formatted Code & Quotes */}
              <div
                className={`chat-bubble text-xs sm:text-[13px] leading-relaxed shadow-sm w-fit ${
                  isTeacher
                    ? "bg-base-200 border border-base-300 text-base-content max-w-[95%] sm:max-w-[90%]"
                    : "chat-bubble-neutral text-neutral-content max-w-[85%]"
                }`}
              >
                <FormattedMessage text={msg.text} />
              </div>

              {/* Chat Footer */}
              <div className="chat-footer opacity-50 text-[10px] mt-0.5">
                {isTeacher ? "Delivered" : "Sent"}
              </div>
            </div>
          );
        })}

        {/* DaisyUI Typing Indicator */}
        {isTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xs shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div className="chat-header text-[11px] text-base-content/70 mb-1">
              <span className="font-semibold text-base-content">DSA Teacher</span>
            </div>
            <div className="chat-bubble bg-base-200 border border-base-300 flex items-center gap-1.5 py-2 px-3 text-base-content">
              <span className="loading loading-dots loading-xs text-primary"></span>
              <span className="text-[11px] opacity-80">DSA Teacher is judging your question...</span>
            </div>
          </div>
        )}

        {/* Target anchor using useRef hook for auto-scrolling to latest chat */}
        <div ref={latestChatRef} />
      </div>

      {/* Unauthenticated Alert Banner */}
      {!isAuthenticated && (
        <div className="px-3 py-2 bg-warning/15 border-t border-warning/30 flex items-center justify-between text-xs text-warning-content shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-warning">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Sign in to chat with your DSA Teacher</span>
          </div>
          {onNavigateToLogin && (
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="btn btn-warning btn-xs text-[10px] h-6 min-h-0"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Quick Prompts Chips */}
      <div className="px-3 py-1.5 bg-base-200/50 border-t border-base-300 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] text-base-content/50 uppercase font-semibold shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-warning" />
          Suggestions:
        </span>
        {quickPrompts.map((promptText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(promptText)}
            disabled={isTyping || !isAuthenticated}
            className="badge badge-sm badge-outline hover:badge-primary cursor-pointer text-[10px] whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* DaisyUI Chat Input Bar */}
      <div className="p-2.5 bg-base-100 border-t border-base-300 flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          placeholder={
            isAuthenticated
              ? "Ask your DSA teacher a question or ask for a critique on your code..."
              : "Please sign in to chat with the DSA Teacher..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isTyping || !isAuthenticated}
          className="input input-sm input-bordered flex-1 text-xs focus:outline-primary disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isTyping || !isAuthenticated}
          className="btn btn-sm btn-primary gap-1 px-3 disabled:opacity-50"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Send</span>
        </button>
      </div>
    </div>
  );
}
