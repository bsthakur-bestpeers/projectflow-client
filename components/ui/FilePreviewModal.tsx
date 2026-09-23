import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { resolveFileUrl } from "@/lib/utils";

interface FilePreviewModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilePreviewModal({ url, isOpen, onClose }: FilePreviewModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [url]);

  if (!isOpen || !url) return null;

  const resolvedUrl = resolveFileUrl(url);

  const getFileType = (fileUrl: string) => {
    const cleanUrl = fileUrl.split(/[?#]/)[0];
    const ext = cleanUrl.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    if (["pdf"].includes(ext)) return "pdf";
    if (["mp4", "webm", "ogg"].includes(ext)) return "video";
    return "other";
  };

  const fileType = getFileType(resolvedUrl);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Preview" size="lg">
      <div className="flex flex-col h-[60vh] max-h-[600px] w-full bg-slate-50/50 rounded-xl overflow-hidden border border-slate-200">
        {fileType === "image" && (
          <div className="w-full h-full flex items-center justify-center p-4">
            {imgError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">Image preview unavailable</h4>
                <p className="text-xs text-slate-500 mb-4 max-w-sm">
                  The image could not be loaded from the server.
                </p>
                <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm">Open Image in New Tab</Button>
                </a>
              </div>
            ) : (
              <img
                src={resolvedUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain drop-shadow-md rounded-lg"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        )}
        
        {fileType === "pdf" && (
          <iframe src={resolvedUrl} className="w-full h-full border-0" title="PDF Preview" />
        )}
        
        {fileType === "video" && (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video src={resolvedUrl} controls className="max-w-full max-h-full" />
          </div>
        )}

        {fileType === "other" && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <span className="text-3xl">📄</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No Preview Available</h3>
            <p className="text-sm text-slate-500 mb-6">This file type cannot be previewed in the browser.</p>
            <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
              <Button>Download File</Button>
            </a>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

