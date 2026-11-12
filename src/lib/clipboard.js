/**
 * Utility to reliably copy text to clipboard across all browser environments.
 * Uses navigator.clipboard with textarea fallback for older browsers or iframes.
 */
export const copyToClipboard = async (text) => {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("navigator.clipboard.writeText failed, using fallback:", err);
  }

  // 2. Fallback using temporary textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error("Clipboard copy failed entirely:", fallbackErr);
    return false;
  }
};

