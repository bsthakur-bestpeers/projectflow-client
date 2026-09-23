"use client";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef } from "react";
import { createPortal } from "react-dom";

interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: (e: { target: { value: string } }) => void;
  id?: string;
  disabled?: boolean;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, value, onChange, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [rect, setRect] = useState<DOMRect | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === String(value));

    const updatePosition = () => {
      if (containerRef.current) {
        setRect(containerRef.current.getBoundingClientRect());
      }
    };

    useEffect(() => {
      if (isOpen) {
        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
      }
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, [isOpen]);

    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (
          containerRef.current && 
          !containerRef.current.contains(event.target as Node) &&
          (!dropdownRef.current || !dropdownRef.current.contains(event.target as Node))
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val: string) => {
      onChange?.({ target: { value: val } });
      setIsOpen(false);
      setSearch("");
    };

    return (
      <div className="w-full relative" ref={containerRef}>
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
            {label}
          </label>
        )}
        
        <div
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-800 text-left relative",
            "bg-white border transition-all duration-150 shadow-2xs cursor-pointer select-none",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 flex justify-between items-center",
            error
              ? "border-rose-300 focus:ring-rose-200 focus:border-rose-500"
              : "border-slate-200/90 hover:border-slate-300",
            isOpen && "border-indigo-500 ring-2 ring-indigo-500/20",
            disabled && "opacity-60 cursor-not-allowed bg-slate-50",
            className
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          {...props}
        >
          <span className={cn("block truncate", !selectedOption && "text-slate-400")}>
            {selectedOption ? selectedOption.label : (placeholder || "Select option...")}
          </span>
          <span className="pointer-events-none flex items-center bg-transparent">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

        {isOpen && !disabled && typeof window !== "undefined" && createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[99999] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col"
            style={{
              top: rect ? rect.bottom : 0,
              left: rect ? rect.left : 0,
              width: rect ? rect.width : 'auto',
            }}
          >
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <input
                type="text"
                className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="overflow-y-auto p-1 max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500 text-center">No results found.</div>
              ) : (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      "px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-colors",
                      opt.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-indigo-50 hover:text-indigo-700 text-slate-700",
                      opt.value === String(value) && "bg-indigo-50 text-indigo-700 font-medium"
                    )}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}

        {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
export default Select;
