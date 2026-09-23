import Modal from "./Modal";
import Button from "./Button";

interface FilePreviewModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilePreviewModal({ url, isOpen, onClose }: FilePreviewModalProps) {
  if (!isOpen || !url) return null;

  const getFileType = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    if (["pdf"].includes(ext)) return "pdf";
    if (["mp4", "webm", "ogg"].includes(ext)) return "video";
    return "other";
  };

  const fileType = getFileType(url);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Preview" size="lg">
      <div className="flex flex-col h-[60vh] max-h-[600px] w-full bg-slate-50/50 rounded-xl overflow-hidden border border-slate-200">
        {fileType === "image" && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img src={url} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-md rounded-lg" />
          </div>
        )}
        
        {fileType === "pdf" && (
          <iframe src={url} className="w-full h-full border-0" title="PDF Preview" />
        )}
        
        {fileType === "video" && (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video src={url} controls className="max-w-full max-h-full" />
          </div>
        )}

        {fileType === "other" && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <span className="text-3xl">📄</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No Preview Available</h3>
            <p className="text-sm text-slate-500 mb-6">This file type cannot be previewed in the browser.</p>
            <a href={url} target="_blank" rel="noopener noreferrer">
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
