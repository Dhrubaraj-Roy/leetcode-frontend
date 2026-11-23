import React, { useEffect, useRef } from "react";
import { AlertTriangle, AlertCircle, X, Check } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "brand"
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto focus confirm or cancel button
    if (confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  // Variant styling
  const variantStyles = {
    danger: {
      iconBg: "bg-rose-500/10 text-[#ff375f] border-rose-500/20",
      buttonBg: "bg-[#ff375f] hover:bg-[#e03152] text-white",
      Icon: AlertTriangle,
    },
    warning: {
      iconBg: "bg-amber-500/10 text-[#ffc01e] border-amber-500/20",
      buttonBg: "bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a]",
      Icon: AlertCircle,
    },
    brand: {
      iconBg: "bg-[#ffa116]/10 text-[#ffa116] border-[#ffa116]/20",
      buttonBg: "bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a]",
      Icon: Check,
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.danger;
  const VariantIcon = currentVariant.Icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="w-full max-w-md bg-[#262626] border border-[#333333] rounded-xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 text-[#eff1f6]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${currentVariant.iconBg}`}
          >
            <VariantIcon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="confirm-modal-title"
              className="text-base font-bold text-white tracking-tight"
            >
              {title}
            </h3>
            <div
              id="confirm-modal-desc"
              className="text-xs text-gray-300 mt-1.5 leading-relaxed"
            >
              {message}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#333333] transition-colors -mr-1 -mt-1 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#333333]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-[#1e1e1e] hover:bg-[#333333] border border-[#383838] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer ${currentVariant.buttonBg} ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin mr-1"></div>
            )}
            <span>{isLoading ? "Processing..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
