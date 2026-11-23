import React, { Component } from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({
              error: this.state.error,
              reset: this.handleReset,
            })
          : this.props.fallback;
      }

      const {
        title = "Something went wrong",
        message = "An unexpected error occurred while rendering this component.",
        compact = false,
      } = this.props;

      if (compact) {
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full bg-[#1e1e1e] border border-[#333333] rounded-lg text-gray-300 space-y-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-[#ff375f] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">{title}</div>
              <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs">
                {this.state.error?.message || message}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#ffa116] text-[#1a1a1a] hover:bg-[#e68a00] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-[300px] w-full flex items-center justify-center p-6 bg-[#1a1a1a] text-white">
          <div className="max-w-md w-full bg-[#262626] border border-[#333333] rounded-xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-[#ff375f] flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                {message}
              </p>
            </div>

            {this.state.error?.message && (
              <div className="text-left bg-[#1e1e1e] border border-[#333333] p-3 rounded-md text-[11px] font-mono text-rose-300 break-words max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-[#1e1e1e] hover:bg-[#333333] border border-[#383838] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
