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
  Film,
  FileVideo,
  Clock,
  HardDrive,
  ExternalLink,
  RefreshCw,
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
  const [uploadStep, setUploadStep] = useState(0); // 0 = idle, 1 = signature, 2 = formData, 3 = cloudinary, 4 = save metadata
  const [uploadProgress, setUploadProgress] = useState(0); // 0 to 100 %
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch existing video for this problem when modal opens
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
      // 404 indicates no video has been uploaded yet, which is expected
      setExistingVideo(null);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  // Handle file selection with 100MB validation
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

    // Check if file is a video
    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
      setFileError("Please select a valid video file (MP4, WebM, MOV, MKV).");
      setSelectedFile(null);
      return;
    }

    // Check max size: 100 MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`File size (${sizeInMb} MB) exceeds the 100 MB limit. Please select a smaller video.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  /**
   * 4-Step Video Upload Implementation:
   * Step 1: Get upload signature from backend
   * Step 2: Create FormData for Cloudinary upload
   * Step 3: Upload directly to Cloudinary
   * Step 4: Save metadata to backend
   */
  const handleUploadVideo = async () => {
    if (!selectedFile || !problem?._id) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadProgress(0);

    try {
      // ----------------------------------------------------
      // STEP 1: Get digital signature from backend
      // ----------------------------------------------------
      setUploadStep(1);
      setStatusMessage("Step 1/4: Requesting digital upload signature from backend...");

      const signatureData = await getVideoUploadSignature({
        problemId: problem._id,
      });

      if (!signatureData?.signature || !signatureData?.uploadUrl) {
        throw new Error("Failed to obtain a valid upload signature from backend.");
      }

      // ----------------------------------------------------
      // STEP 2: Create FormData for Cloudinary direct upload
      // ----------------------------------------------------
      setUploadStep(2);
      setStatusMessage("Step 2/4: Preparing upload package and parameters...");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", signatureData.timestamp);
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder || "leetcode/videos");
      if (signatureData.publicId) {
        formData.append("public_id", signatureData.publicId);
      }

      // ----------------------------------------------------
      // STEP 3: Upload directly to Cloudinary
      // ----------------------------------------------------
      setUploadStep(3);
      setStatusMessage("Step 3/4: Uploading video directly to Cloudinary...");

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
        throw new Error("Cloudinary upload failed: No URL returned.");
      }

      // ----------------------------------------------------
      // STEP 4: Save metadata to backend
      // ----------------------------------------------------
      setUploadStep(4);
      setStatusMessage("Step 4/4: Saving metadata & generating video thumbnail on backend...");

      const savedVideoResponse = await saveVideoMetadataApi({
        problemId: problem._id,
        videoUrl: uploadedData.secure_url || uploadedData.url,
        publicId: uploadedData.public_id,
        duration: uploadedData.duration || 0,
        format: uploadedData.format || "mp4",
        bytes: uploadedData.bytes || selectedFile.size,
      });

      setSuccessMessage("Solution video uploaded and saved successfully!");
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

  // Handle Video Deletion
  const handleDeleteVideo = async () => {
    if (!existingVideo?._id && !problem?._id) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const targetId = existingVideo?._id || problem._id;
      await deleteVideoApi(targetId);
      setSuccessMessage("Video successfully deleted from Cloudinary and database.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-base-100 border border-base-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                Solution Video
                {problem?.difficulty && (
                  <span
                    className={`badge badge-xs text-[10px] font-semibold uppercase ${
                      problem.difficulty.toLowerCase() === "easy"
                        ? "badge-success text-success-content"
                        : problem.difficulty.toLowerCase() === "medium"
                        ? "badge-warning text-warning-content"
                        : "badge-error text-error-content"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                )}
              </h2>
              <p className="text-xs text-base-content/60 truncate max-w-md">
                {problem?.title || "Problem Solution"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading || isDeleting}
            className="btn btn-sm btn-circle btn-ghost text-base-content/70 hover:text-base-content"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Success Alert */}
          {successMessage && (
            <div className="alert alert-success text-xs py-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="alert alert-error text-xs py-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading Existing Video */}
          {isLoadingExisting ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-base-content/60">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs">Checking existing solution video...</p>
            </div>
          ) : existingVideo ? (
            /* Existing Video View (One problem, one solution video) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="badge badge-success badge-sm gap-1.5 font-medium text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Solution Video
                </span>
                <span className="text-[11px] text-base-content/60">
                  Uploaded: {new Date(existingVideo.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Video Player */}
              <div className="rounded-xl overflow-hidden border border-base-300 bg-black aspect-video relative shadow-inner">
                <video
                  src={existingVideo.videoUrl}
                  poster={existingVideo.thumbnailUrl}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-base-200/50 p-2.5 rounded-lg border border-base-300/50">
                  <span className="text-[10px] text-base-content/60 block">Duration</span>
                  <span className="font-semibold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {existingVideo.duration ? `${Math.round(existingVideo.duration)}s` : "N/A"}
                  </span>
                </div>
                <div className="bg-base-200/50 p-2.5 rounded-lg border border-base-300/50">
                  <span className="text-[10px] text-base-content/60 block">Format</span>
                  <span className="font-semibold uppercase flex items-center gap-1 mt-0.5">
                    <Film className="w-3.5 h-3.5 text-secondary" />
                    {existingVideo.format || "mp4"}
                  </span>
                </div>
                <div className="bg-base-200/50 p-2.5 rounded-lg border border-base-300/50">
                  <span className="text-[10px] text-base-content/60 block">Size</span>
                  <span className="font-semibold flex items-center gap-1 mt-0.5">
                    <HardDrive className="w-3.5 h-3.5 text-accent" />
                    {existingVideo.bytes
                      ? `${(existingVideo.bytes / (1024 * 1024)).toFixed(1)} MB`
                      : "N/A"}
                  </span>
                </div>
                <div className="bg-base-200/50 p-2.5 rounded-lg border border-base-300/50">
                  <span className="text-[10px] text-base-content/60 block">Direct URL</span>
                  <a
                    href={existingVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-semibold flex items-center gap-1 mt-0.5 truncate"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Delete / Replace Section */}
              <div className="pt-3 border-t border-base-300 flex items-center justify-between">
                <p className="text-xs text-base-content/60">
                  To upload a new video, please delete the current one first.
                </p>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="btn btn-ghost btn-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteVideo}
                      disabled={isDeleting}
                      className="btn btn-error btn-xs gap-1.5"
                    >
                      {isDeleting ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Confirm Delete
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn btn-outline btn-error btn-xs gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Video
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Upload New Video Form */
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  selectedFile
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-base-200 text-primary mx-auto flex items-center justify-center mb-3 shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-sm text-base-content mb-1">
                  {selectedFile ? "Replace Selected Video" : "Choose a video or drag & drop"}
                </h3>
                <p className="text-xs text-base-content/60 mb-2">
                  MP4, WebM, MOV, or MKV (Maximum file size: <strong>100 MB</strong>)
                </p>
                <div className="badge badge-outline badge-xs text-[10px] text-base-content/60">
                  Direct Cloudinary Streaming
                </div>
              </div>

              {/* Selected File Card */}
              {selectedFile && (
                <div className="p-3 bg-base-200/60 rounded-xl border border-base-300 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileVideo className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-base-content truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-base-content/60">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || "video"}
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="btn btn-ghost btn-circle btn-xs text-error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* File Error Alert */}
              {fileError && (
                <div className="alert alert-warning text-xs py-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Upload Progress & 4-Step Indicator */}
              {isUploading && (
                <div className="space-y-3 p-4 bg-base-200/40 rounded-xl border border-base-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-base-content flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                      {statusMessage}
                    </span>
                    <span className="font-mono text-primary font-bold">
                      {uploadStep === 3 ? `${uploadProgress}%` : "Processing"}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <progress
                    className="progress progress-primary w-full h-2"
                    value={uploadStep === 3 ? uploadProgress : uploadStep === 4 ? 100 : 15}
                    max="100"
                  ></progress>

                  {/* 4 Steps Visual Pills */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                    <div
                      className={`text-[10px] py-1 rounded font-medium ${
                        uploadStep >= 1 ? "bg-primary/20 text-primary" : "bg-base-200 text-base-content/40"
                      }`}
                    >
                      1. Signature
                    </div>
                    <div
                      className={`text-[10px] py-1 rounded font-medium ${
                        uploadStep >= 2 ? "bg-primary/20 text-primary" : "bg-base-200 text-base-content/40"
                      }`}
                    >
                      2. FormData
                    </div>
                    <div
                      className={`text-[10px] py-1 rounded font-medium ${
                        uploadStep >= 3 ? "bg-primary/20 text-primary" : "bg-base-200 text-base-content/40"
                      }`}
                    >
                      3. Cloudinary
                    </div>
                    <div
                      className={`text-[10px] py-1 rounded font-medium ${
                        uploadStep >= 4 ? "bg-primary/20 text-primary" : "bg-base-200 text-base-content/40"
                      }`}
                    >
                      4. Save DB
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-base-300 flex items-center justify-between bg-base-200/30">
          <span className="text-[11px] text-base-content/50">
            Allowed size: Up to 100 MB • Secure direct Cloudinary upload
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading || isDeleting}
              className="btn btn-sm btn-ghost"
            >
              Close
            </button>
            {!existingVideo && (
              <button
                type="button"
                onClick={handleUploadVideo}
                disabled={!selectedFile || isUploading}
                className="btn btn-sm btn-primary gap-1.5"
              >
                {isUploading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                Upload Video (Max 100MB)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
