import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#1a1a1a] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#262626] border border-[#333333] rounded-xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-[#ffa116]/10 text-[#ffa116] border border-[#ffa116]/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ffa116]">
            Error 404
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Page Not Found
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or the link may be broken.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Problems</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
