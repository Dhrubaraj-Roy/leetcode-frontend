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
  Copy,
  Check,
  X,
} from "lucide-react";
import { sendChatMessageApi } from "../lib/api";
import {
  addChatMessage,
  setChatMessages,
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

  // Channel ID for conversation persistence
  const channelId = problem?._id || problem?.id || "global";
  const rawChannelMessages = useSelector(
    (state) => state.chat.conversations[channelId]
  );

  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const getInitialMessage = () => {
    if (!isAuthenticated) {
      return "Hello! Please sign in to consult with the DSA Tutor on algorithmic concepts and code evaluations.";
    }
    const studentName = user?.firstName ? user.firstName : "there";
    if (problem?.title) {
      return `Hi ${studentName}! I'm your DSA Tutor. Working on "${problem.title}"? Feel free to ask about the optimal algorithm, time/space complexity, or debugging your solution!`;
    }
    return `Hi ${studentName}! I'm your DSA Tutor. Ask me any question about Data Structures, Algorithms, or your code.`;
  };

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

  const latestChatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    latestChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isAuthenticated) {
      inputRef.current?.focus();
    }
  }, [isAuthenticated]);

  const handleCopyMessage = async (msgId, text) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const quickPrompts = problem?.title
    ? [
        "Optimal time complexity?",
        "Can you review my code?",
        "Algorithmic hint",
        "Edge cases to test?",
      ]
    : [
        "Explain Big-O notation",
        "Binary search intuition",
        "Two Pointers pattern",
        "Dynamic programming tips",
      ];

  const handleSendMessage = async (customText = null) => {
    const textToSend = (typeof customText === "string" ? customText : input).trim();
    if (!textToSend || isTyping) return;

    if (!isAuthenticated) {
      const authNotice = {
        id: `auth-notice-${Date.now()}`,
        role: "teacher",
        text: "Please sign in to your account to chat with the DSA Tutor.",
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
        "No response from DSA Tutor.";

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
      let errorText = "Could not send message. Please verify network connectivity.";

      if (status === 401) {
        errorText = "Please sign in to chat with the DSA Tutor.";
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
    <div className="flex flex-col h-full bg-panel text-primary overflow-hidden select-text">
      {/* Header Bar */}
      <div className="h-11 bg-panel-header border-b border-border px-3 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-white truncate">
              DSA Tutor
            </span>
            <span
              className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                isAuthenticated
                  ? "bg-emerald-500/10 text-easy"
                  : "bg-amber-500/10 text-medium"
              }`}
            >
              {isAuthenticated ? "Online" : "Sign in required"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-gray-400 hover:text-white hover:bg-panel-hover transition-colors"
            title="Clear Chat"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-panel-hover transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
        {messages.map((msg) => {
          const isTeacher = msg.role === "teacher";

          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1 ${
                isTeacher ? "items-start" : "items-end"
              }`}
            >
              {/* Message Meta */}
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1">
                <span className="font-medium text-gray-300">
                  {isTeacher ? "DSA Tutor" : "You"}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>

                <button
                  type="button"
                  onClick={() => handleCopyMessage(msg.id, msg.text)}
                  className="opacity-50 hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-panel-hover"
                  title="Copy message"
                >
                  {copiedMessageId === msg.id ? (
                    <Check className="w-3 h-3 text-easy" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3 rounded-lg text-xs leading-relaxed max-w-[92%] sm:max-w-[85%] ${
                  isTeacher
                    ? "bg-panel-subtle border border-border text-gray-200 shadow-xs"
                    : "bg-brand/15 border border-brand/30 text-white"
                }`}
              >
                <FormattedMessage text={msg.text} />
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex flex-col items-start space-y-1">
            <div className="text-[10px] text-gray-400 px-1">
              DSA Tutor • Thinking...
            </div>
            <div className="p-2.5 rounded-lg bg-panel-subtle border border-border text-xs text-gray-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand animate-ping"></div>
              <span>Thinking about your question...</span>
            </div>
          </div>
        )}

        <div ref={latestChatRef} />
      </div>

      {/* Unauthenticated Alert */}
      {!isAuthenticated && (
        <div className="px-3 py-2 bg-amber-500/10 border-t border-amber-500/25 flex items-center justify-between text-xs text-medium shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Sign in to ask questions to the DSA Tutor</span>
          </div>
          {onNavigateToLogin && (
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-2 py-0.5 rounded bg-brand text-canvas text-[10px] font-semibold hover:bg-brand-hover transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Quick Suggestions Chips */}
      <div className="px-3 py-1.5 bg-panel-subtle border-t border-border flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
        <span className="text-gray-400 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-brand" />
          Suggestions:
        </span>
        {quickPrompts.map((promptText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(promptText)}
            disabled={isTyping || !isAuthenticated}
            className="px-2.5 py-0.5 rounded-full bg-panel hover:bg-panel-hover border border-border-subtle text-gray-300 hover:text-white whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-2.5 bg-panel-header border-t border-border flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          placeholder={
            isAuthenticated
              ? "Ask a question about the algorithm or code..."
              : "Please sign in to chat with the DSA Tutor..."
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
          className="w-full h-8 px-3 bg-panel-subtle border border-border rounded text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-brand disabled:opacity-50 transition-colors"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isTyping || !isAuthenticated}
          className="h-8 px-3 rounded bg-brand hover:bg-brand-hover text-canvas text-xs font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
          title="Send"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
}
