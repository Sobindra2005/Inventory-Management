"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadResponse {
  id: string;
  filename: string;
  cloudinary_url: string;
  extracted_text: string;
  status: string;
}

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith("image/")) {
        setError("Please drop a valid image file.");
        return;
      }
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError(null);
      setResult(null);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Connect to the backend
      // Provide fallback for docker reverse proxy logic via NEXT_PUBLIC_API_URL or relative
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${apiUrl}/upload-bill`, {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        const body = isJson ? await response.json() : await response.text();
        const message = isJson && body && typeof body.detail === "string"
          ? body.detail
          : typeof body === "string" ? body : "Upload failed";
        throw new Error(message);
      }

      const data = isJson ? await response.json() : null;
      if (!data) throw new Error("Server did not return JSON. Check that the request reaches the backend API.");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Upload Section */}
        <div className="flex flex-col gap-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[300px]
              ${
                preview
                  ? "border-blue-500 bg-blue-50/5 dark:bg-blue-900/10"
                  : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full h-full flex flex-col items-center gap-4"
                >
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate w-full text-center">
                    {file?.name}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-500">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      Upload your bill
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Drag & drop an image, or click to browse
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-500/20"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            {file && !result && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={uploadFile}
                disabled={uploading}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all shadow-lg ${
                  uploading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Process Document
                  </>
                )}
              </motion.button>
            )}
            
            {file && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={reset}
                className="px-6 py-4 rounded-2xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all"
              >
                Clear
              </motion.button>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">Extraction Complete</h3>
                </div>
                
                <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
                  
                  <div className="flex flex-col h-full gap-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Extracted Data
                      </span>
                      <a 
                        href={result.cloudinary_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600 font-medium px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full transition-colors"
                      >
                        View Original
                      </a>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {result.extracted_text ? (
                        <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                          {result.extracted_text}
                        </pre>
                      ) : (
                        <p className="text-gray-400 italic text-sm text-center py-10">
                          No text could be extracted from this image.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center p-10 text-center min-h-[300px]"
              >
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400">
                  <FileText className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  Awaiting Document
                </h3>
                <p className="text-sm text-gray-400 shrink-0 mt-2 max-w-[250px]">
                  Upload a bill or receipt to extract its text using PaddleOCR in real-time.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
