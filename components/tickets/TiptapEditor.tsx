"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { uploadApi, UploadedFile } from "@/services/api";
import FilePreviewModal from "./../ui/FilePreviewModal";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

interface AttachedFile extends UploadedFile {
  id: string;
}

const ToolbarButton = ({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "w-7 h-7 flex items-center justify-center rounded transition-all cursor-pointer",
      active
        ? "bg-slate-200 text-slate-800"
        : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
    )}
  >
    {children}
  </button>
);

const getFileIcon = (mimetype: string) => {
  if (mimetype.startsWith("image/")) return "🖼️";
  if (mimetype === "application/pdf") return "📄";
  if (mimetype.startsWith("video/")) return "🎬";
  return "📎";
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Strip the absolute backend host from upload URLs so the frontend proxy handles them */
const toRelativeUploadUrl = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.pathname.startsWith("/uploads/")) return u.pathname;
  } catch { /* not a full URL, return as-is */ }
  return url;
};

/** Infer mimetype from filename extension */
const inferMimetype = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
    webp: "image/webp", svg: "image/svg+xml",
    pdf: "application/pdf",
    mp4: "video/mp4", webm: "video/webm", ogg: "video/ogg",
  };
  return map[ext] || "application/octet-stream";
};

/** Parse HTML string to extract attachments from hidden data div or legacy <a>/<img> tags */
const extractAttachmentsFromHtml = (html: string): AttachedFile[] => {
  if (!html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const files: AttachedFile[] = [];
  const seen = new Set<string>();

  // Try parsing from hidden data div first (new format)
  const dataDiv = doc.querySelector("[data-attachments]");
  if (dataDiv) {
    try {
      let raw = dataDiv.getAttribute("data-attachments") || "[]";
      if (raw.includes("&quot;")) {
        raw = raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((f: { url: string; filename: string; originalName: string; mimetype: string; size: number }) => {
          if (f && f.filename && !seen.has(f.filename)) {
            seen.add(f.filename);
            files.push({ ...f, id: `${f.filename}-loaded` });
          }
        });
      }
    } catch { /* ignore parse errors */ }
  }

  // Fallback / legacy: find <a> tags pointing to /uploads/
  doc.querySelectorAll('a[href*="/uploads/"]').forEach((el) => {
    const href = el.getAttribute("href") || "";
    const url = toRelativeUploadUrl(href);
    const filename = url.split("/").pop() || "";
    if (filename && !seen.has(filename)) {
      seen.add(filename);
      const textContent = el.textContent?.replace(/^📎\s*/, "") || filename;
      files.push({ id: `${filename}-loaded`, url, filename, originalName: textContent, mimetype: inferMimetype(filename), size: 0 });
    }
  });

  // Fallback / legacy: find <img> tags pointing to /uploads/
  doc.querySelectorAll('img[src*="/uploads/"]').forEach((el) => {
    const src = el.getAttribute("src") || "";
    const url = toRelativeUploadUrl(src);
    const filename = url.split("/").pop() || "";
    if (filename && !seen.has(filename)) {
      seen.add(filename);
      files.push({ id: `${filename}-loaded`, url, filename, originalName: filename, mimetype: inferMimetype(filename), size: 0 });
    }
  });

  return files;
};

/** Remove /uploads/ links, images, and data divs from HTML so the editor only shows text content */
const stripUploadsFromHtml = (html: string): string => {
  if (!html) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc.querySelectorAll('a[href*="/uploads/"]').forEach((el) => el.remove());
  doc.querySelectorAll('img[src*="/uploads/"]').forEach((el) => el.remove());
  doc.querySelectorAll("[data-attachments]").forEach((el) => el.remove());

  // Remove empty paragraphs left behind
  doc.querySelectorAll("p").forEach((p) => {
    if (!p.textContent?.trim() && !p.querySelector("img, a")) {
      p.remove();
    }
  });

  return doc.body.innerHTML;
};

/** Build the full HTML that includes editor content + hidden attachment data */
const buildHtmlWithAttachments = (editorHtml: string, attachments: AttachedFile[]): string => {
  if (attachments.length === 0) return editorHtml;
  const data = attachments.map(({ url, filename, originalName, mimetype, size }) => ({ url, filename, originalName, mimetype, size }));
  return `${editorHtml}<div data-attachments='${JSON.stringify(data)}' style="display:none"></div>`;
};

export default function TiptapEditor({ content, onChange, readOnly, placeholder }: TiptapEditorProps) {
  const defaultPlaceholder = "Type /ai to Ask Rovo or @ to mention and notify someone.";
  
  const initialAttachments = useRef<AttachedFile[]>(extractAttachmentsFromHtml(content));
  const cleanContent = useRef<string>(stripUploadsFromHtml(content));

  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [attachments, setAttachments] = useState<AttachedFile[]>(initialAttachments.current);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestAttachments = useRef<AttachedFile[]>(initialAttachments.current);
  const latestEditorHtml = useRef<string>(cleanContent.current);
  const lastEmittedHtml = useRef<string>(content);

  const emitChange = (editorHtml: string, currentAttachments: AttachedFile[]) => {
    const fullHtml = buildHtmlWithAttachments(editorHtml, currentAttachments);
    lastEmittedHtml.current = fullHtml;
    onChange(fullHtml);
  };

  const uploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadCount(files.length);

    try {
      let uploadedFiles: UploadedFile[];

      if (files.length === 1) {
        const data = await uploadApi.uploadFile(files[0]);
        uploadedFiles = [data];
      } else {
        uploadedFiles = await uploadApi.uploadMultiple(files);
      }

      const newAttachments: AttachedFile[] = uploadedFiles.map((f) => ({
        ...f,
        url: toRelativeUploadUrl(f.url),
        id: `${f.filename}-${Date.now()}`,
      }));

      setAttachments((prev) => {
        const combined = [...prev, ...newAttachments];
        latestAttachments.current = combined;
        emitChange(latestEditorHtml.current, combined);
        return combined;
      });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadCount(0);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: cleanContent.current || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      latestEditorHtml.current = html;
      emitChange(html, latestAttachments.current);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose-editor prose-sm max-w-none min-h-[140px] px-3 py-3",
          "focus:outline-none leading-relaxed",
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:text-slate-400 [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none"
        ),
        "data-placeholder": placeholder ?? defaultPlaceholder,
      },
      handlePaste: (view, event) => {
        if (readOnly) return false;
        const items = event.clipboardData?.items;
        if (!items) return false;
        const pastedFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              let fileToUpload = file;
              if (file.name === "image.png") {
                fileToUpload = new File([file], `screenshot-${Date.now()}.png`, { type: file.type });
              }
              pastedFiles.push(fileToUpload);
            }
          }
        }
        if (pastedFiles.length > 0) {
          event.preventDefault();
          uploadFiles(pastedFiles);
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        if (readOnly) return false;
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        event.preventDefault();
        uploadFiles(Array.from(files));
        return true;
      },
    },
  });

  // Sync when content prop changes externally (e.g. ticket loaded, modal switched, or form reset)
  useEffect(() => {
    if (content === lastEmittedHtml.current) {
      return;
    }
    lastEmittedHtml.current = content;
    const parsed = extractAttachmentsFromHtml(content);
    setAttachments(parsed);
    latestAttachments.current = parsed;
    const clean = stripUploadsFromHtml(content);
    latestEditorHtml.current = clean;
    if (editor && editor.getHTML() !== clean) {
      editor.commands.setContent(clean || "");
    }
  }, [content, editor]);

  if (!editor) return null;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    await uploadFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = async (attachment: AttachedFile) => {
    try {
      await uploadApi.deleteFile(attachment.filename);
      const remaining = attachments.filter((a) => a.id !== attachment.id);
      setAttachments(remaining);
      latestAttachments.current = remaining;
      emitChange(latestEditorHtml.current, remaining);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <>
      <div
        className={cn(
          "border rounded-md overflow-hidden bg-white transition-all relative",
          readOnly ? "border-transparent" : "border-slate-300 hover:border-slate-400",
          !readOnly && "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 focus-within:hover:border-blue-500"
        )}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-700">
                Uploading {uploadCount > 1 ? `${uploadCount} files` : "file"}...
              </span>
            </div>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        {!readOnly && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap border-b border-slate-100/80">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
            </ToolbarButton>
            
            <div className="w-px h-5 bg-slate-200 mx-1" />
            
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
              <span className="text-xs font-bold font-serif">H1</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
              <span className="text-xs font-bold font-serif">H2</span>
            </ToolbarButton>
            
            <div className="w-px h-5 bg-slate-200 mx-1" />
            
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
            </ToolbarButton>
            
            <div className="w-px h-5 bg-slate-200 mx-1" />
            
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
            </ToolbarButton>
            
            <div className="w-px h-5 bg-slate-200 mx-1" />
            
            <ToolbarButton onClick={handleImageClick} title="Attach Files">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </ToolbarButton>
            <ToolbarButton onClick={handleImageClick} title="Upload Images">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </ToolbarButton>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Attachments Strip */}
      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs hover:border-indigo-300 transition-colors"
            >
              {att.mimetype.startsWith("image/") ? (
                <div
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer overflow-hidden bg-slate-100 flex items-center justify-center shrink-0"
                  onClick={() => setPreviewUrl(att.url)}
                >
                  <img
                    src={att.url}
                    alt={att.originalName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = '<span class="text-base">🖼️</span>';
                    }}
                  />
                </div>
              ) : (
                <span
                  className="text-base cursor-pointer"
                  onClick={() => setPreviewUrl(att.url)}
                >
                  {getFileIcon(att.mimetype)}
                </span>
              )}
              <div className="flex flex-col min-w-0">
                <span
                  className="font-semibold text-slate-700 truncate max-w-[120px] cursor-pointer hover:text-indigo-600"
                  title={att.originalName}
                  onClick={() => setPreviewUrl(att.url)}
                >
                  {att.originalName}
                </span>
                {att.size > 0 && (
                  <span className="text-slate-400 text-[10px]">{formatFileSize(att.size)}</span>
                )}
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att)}
                  className="ml-1 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Remove"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <FilePreviewModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        url={previewUrl || ""}
      />
    </>
  );
}
