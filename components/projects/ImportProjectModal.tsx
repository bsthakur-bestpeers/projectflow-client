"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import { projectsApi } from "@/services/api";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
  onSuccess?: () => void;
}

export default function ImportProjectModal({ isOpen, onClose, projectId, onSuccess }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleClose = () => {
    setSelectedFile(null);
    setIsDragging(false);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await projectsApi.downloadSampleTemplate();
      dispatch(addToast({ type: "success", message: "Sample template downloaded successfully." }));
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to download sample template." }));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.endsWith(".xlsx")) {
      dispatch(addToast({ type: "error", message: "Please select an Excel (.xlsx) file." }));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      dispatch(addToast({ type: "error", message: "File size exceeds 15 MB limit." }));
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      dispatch(addToast({ type: "error", message: "Please select a file to import." }));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      if (projectId) {
        const res = await projectsApi.importIntoProject(projectId, formData);
        dispatch(
          addToast({
            type: "success",
            message: `Imported ${res.stats?.ticketsCount || 0} tickets & ${res.stats?.sprintsCount || 0} sprints successfully!`,
          })
        );
        onSuccess?.();
        handleClose();
      } else {
        const res = await projectsApi.importXlsx(formData);
        dispatch(
          addToast({
            type: "success",
            message: `Project "${res.project.name}" imported with ${res.stats?.ticketsCount || 0} tickets!`,
          })
        );
        onSuccess?.();
        handleClose();
        router.push(`/projects/${res.project.id}/board`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import project file.";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={projectId ? "Import Tickets & Sprints" : "Import Project from Excel"}
      subtitle="Upload a .xlsx workbook containing project metadata, sprints, and tickets."
    >
      <div className="space-y-4">
        {/* Sample Template Callout */}
        <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📊</span>
            <div>
              <p className="text-xs font-bold text-indigo-950">Need the correct Excel format?</p>
              <p className="text-[11px] text-indigo-700/80">Download our sample template with pre-styled sheets & columns.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            loading={downloadingTemplate}
            onClick={handleDownloadTemplate}
            className="text-xs font-semibold shrink-0"
          >
            Download Sample
          </Button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50"
              : selectedFile
              ? "border-emerald-400 bg-emerald-50/20"
              : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center">
            <span className="text-3xl mb-2">{selectedFile ? "📗" : "📁"}</span>
            {selectedFile ? (
              <div>
                <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Ready to import
                </p>
                <p className="text-xs text-indigo-600 font-semibold mt-2 hover:underline">
                  Click or drag to change file
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Drag and drop your <span className="text-indigo-600">.xlsx</span> file here
                </p>
                <p className="text-xs text-slate-400 mt-1">or click to browse your device (Max 15MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Information tags */}
        <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
          <p className="font-semibold text-slate-700">Supported Sheets in your Excel file:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
            <li><strong className="text-slate-800">Project Info:</strong> Project Name & Description</li>
            <li><strong className="text-slate-800">Sprints:</strong> Sprint Name, Dates, & Status</li>
            <li><strong className="text-slate-800">Tickets:</strong> Title, Status, Priority, Estimation, Sprint, & Assignee</li>
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            loading={uploading}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Importing..." : "Start Import"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
