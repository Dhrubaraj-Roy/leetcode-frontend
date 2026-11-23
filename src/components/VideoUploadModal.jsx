import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  getVideoUploadSignature,
  saveVideoMetadataApi,
  deleteVideoApi,
  fetchVideoByProblemId,
} from "../lib/api";
import {
  Video,
  UploadCloud,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

// Maximum video file size allowed: 100 MB
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export default function VideoUploadModal({
  problem,
  isOpen,
  onClose,
  onVideoUpdated,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [existingVideo, setExistingVideo] = useState(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // Upload workflow state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && problem?._id) {
      loadExistingVideo(problem._id);
      resetUploadState();
    }
  }, [isOpen, problem?._id]);

  const resetUploadState = () => {
    setSelectedFile(null);
    setFileError(null);
    setIsUploading(false);
    setUploadStep(0);
    setUploadProgress(0);
    setStatusMessage("");
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowDeleteConfirm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadExistingVideo = async (problemId) => {
    setIsLoadingExisting(true);
    try {
      const data = await fetchVideoByProblemId(problemId);
      setExistingVideo(data?.video || null);
    } catch (err) {
      setExistingVideo(null);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    setFileError(null);
    setErrorMessage(null);

    if (!file) return;

    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
      setFileError("Please select a valid video file (MP4, WebM, MOV, MKV).");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`File size (${sizeInMb} MB) exceeds the 100 MB limit.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadVideo = async () => {
    if (!selectedFile || !problem?._id) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadProgress(0);

    try {
      setUploadStep(1);
      setStatusMessage("Requesting upload signature...");

      const signatureData = await getVideoUploadSignature({
        problemId: problem._id,
      });

      if (!signatureData?.signature || !signatureData?.uploadUrl) {
        throw new Error("Failed to acquire upload signature.");
      }

      setUploadStep(2);
      setStatusMessage("Preparing upload package...");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", signatureData.timestamp);
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder || "leetcode/videos");
      if (signatureData.publicId) {
        formData.append("public_id", signatureData.publicId);
      }

      setUploadStep(3);
      setStatusMessage("Uploading video directly to Cloudinary...");

      const cloudinaryResponse = await axios.post(
        signatureData.uploadUrl,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            }
          },
        }
      );

      const uploadedData = cloudinaryResponse.data;
      if (!uploadedData?.secure_url && !uploadedData?.url) {
        throw new Error("No video URL returned from Cloudinary.");
      }

      setUploadStep(4);
      setStatusMessage("Saving video metadata...");

      const savedVideoResponse = await saveVideoMetadataApi({
        problemId: problem._id,
        videoUrl: uploadedData.secure_url || uploadedData.url,
        publicId: uploadedData.public_id,
        duration: uploadedData.duration || 0,
        format: uploadedData.format || "mp4",
        bytes: uploadedData.bytes || selectedFile.size,
      });

      setSuccessMessage("Solution video uploaded successfully!");
      setExistingVideo(savedVideoResponse?.video || null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onVideoUpdated) {
        onVideoUpdated();
      }
    } catch (err) {
      console.error("Video upload error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        "An error occurred while uploading the video.";
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      setUploadStep(0);
    }
  };

  const handleDeleteVideo = async () => {
    if (!existingVideo?._id && !problem?._id) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const targetId = existingVideo?._id || problem._id;
      await deleteVideoApi(targetId);
      setSuccessMessage("Video deleted successfully.");
      setExistingVideo(null);
      setShowDeleteConfirm(false);

      if (onVideoUpdated) {
        onVideoUpdated();
      }
    } catch (err) {
      console.error("Video delete error:", err);
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to delete video."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs text-xs">
      <div className="bg-[#262626] border border-[#333333] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#333333] flex items-center justify-between bg-[#222222]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#ffa116]/10 text-[#ffa116] flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">
                Solution Video
              </div>
              <p className="text-[11px] text-gray-400 truncate max-w-md">
                {problem?.title || "Problem Solution"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading || isDeleting}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[#2cbb5d] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[#ff375f] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoadingExisting ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <div className="w-6 h-6 rounded-full border-2 border-[#ffa116] border-t-transparent animate-spin"></div>
              <p>Checking existing video...</p>
            </div>
          ) : existingVideo ? (
            /* Existing Video View */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-[#2cbb5d]">
                  Active Solution Video
                </span>
                <span className="text-gray-400">
                  Uploaded: {new Date(existingVideo.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Video Player */}
              <div className="rounded-lg overflow-hidden border border-[#333333] bg-black aspect-video relative">
                <video
                  src={existingVideo.videoUrl}
                  poster={existingVideo.thumbnailUrl}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>

              {/* Video Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#333333]">
                  <span className="text-[10px] text-gray-400 block">Duration</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {existingVideo.duration ? `${Math.round(existingVideo.duration)}s` : "--"}
                  </span>
                </div>
                <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#333333]">
                  <span className="text-[10px] text-gray-400 block">Format</span>
                  <span className="font-semibold text-white uppercase mt-0.5 block">
                    {existingVideo.format || "mp4"}
                  </span>
                </div>
                <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#333333]">
                  <span className="text-[10px] text-gray-400 block">Size</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {existingVideo.bytes
                      ? `${(existingVideo.bytes / (1024 * 1024)).toFixed(1)} MB`
                      : "--"}
                  </span>
                </div>
                <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#333333]">
                  <span className="text-[10px] text-gray-400 block">Direct Link</span>
                  <a
                    href={existingVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#ffa116] hover:underline font-semibold flex items-center gap-1 mt-0.5 truncate"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Delete / Replace Action */}
              <div className="pt-3 border-t border-[#333333] flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Delete current video to upload a replacement.
                </p>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="px-2.5 py-1 rounded border border-[#333333] text-gray-300 hover:bg-[#333333]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteVideo}
                      disabled={isDeleting}
                      className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-[#ff375f] font-semibold hover:bg-rose-500/20"
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-2.5 py-1 rounded border border-rose-500/30 text-[#ff375f] hover:bg-rose-500/10 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Video</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Upload New Video Form */
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  selectedFile
                    ? "border-[#ffa116] bg-[#ffa116]/5"
                    : "border-[#3e3e3e] hover:border-[#ffa116]/60 hover:bg-[#1e1e1e]"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-lg bg-[#1e1e1e] text-[#ffa116] mx-auto flex items-center justify-center mb-2.5 border border-[#333333]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="font-semibold text-xs text-white mb-1">
                  {selectedFile ? "Replace Selected Video File" : "Choose a video file or drag and drop"}
                </div>
                <p className="text-[11px] text-gray-400">
                  MP4, WebM, MOV, or MKV (Maximum file size: <strong>100 MB</strong>)
                </p>
              </div>

              {selectedFile && (
                <div className="p-3 bg-[#1e1e1e] rounded-lg border border-[#333333] flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="font-semibold text-white truncate text-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-[#ff375f] hover:underline text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              {fileError && (
                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/25 text-[#ffc01e] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2 p-3 bg-[#1e1e1e] rounded-lg border border-[#333333]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white">
                      {statusMessage}
                    </span>
                    <span className="text-[#ffa116] font-semibold">
                      {uploadStep === 3 ? `${uploadProgress}%` : "Processing"}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-[#333333] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#ffa116] transition-all duration-200 rounded-full"
                      style={{
                        width: `${uploadStep === 3 ? uploadProgress : uploadStep === 4 ? 100 : 25}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#333333] flex items-center justify-between bg-[#222222]">
          <span className="text-[11px] text-gray-500">
            Maximum file size: 100 MB
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading || isDeleting}
              className="px-3 py-1.5 rounded border border-[#333333] bg-[#1e1e1e] hover:bg-[#333333] text-gray-300"
            >
              Close
            </button>
            {!existingVideo && (
              <button
                type="button"
                onClick={handleUploadVideo}
                disabled={!selectedFile || isUploading}
                className="px-3.5 py-1.5 rounded bg-[#ffa116] hover:bg-[#e68a00] text-[#1a1a1a] font-semibold transition-colors disabled:opacity-40"
              >
                Upload Video
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
