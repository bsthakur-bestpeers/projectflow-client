"use client";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useId } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: (e: { target: { value: string } }) => void;
  id?: string;
  disabled?: boolean;
  isSearchable?: boolean;
  required?: boolean;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder = "Select option...",
      className,
      id,
      value,
      onChange,
      disabled,
      isSearchable = true,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === String(value));

    // Update portal dropdown position relative to trigger container synchronously
    const updatePosition = () => {
      if (containerRef.current) {
        setRect(containerRef.current.getBoundingClientRect());
      }
    };

    // Synchronous layout effect before paint when isOpen changes
    useEffect(() => {
      if (isOpen) {
        updatePosition();
      }
    }, [isOpen]);

    // Handle scroll/resize events while open
    useEffect(() => {
      if (!isOpen) return;
      const onScrollOrResize = () => updatePosition();
      window.addEventListener("scroll", onScrollOrResize, true);
      window.addEventListener("resize", onScrollOrResize);
      return () => {
        window.removeEventListener("scroll", onScrollOrResize, true);
        window.removeEventListener("resize", onScrollOrResize);
      };
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          (!dropdownRef.current || !dropdownRef.current.contains(target))
        ) {
          setIsOpen(false);
          setSearch("");
          setActiveIndex(-1);
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Filter options based on typed search
    const filteredOptions = isSearchable && search.trim()
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          (opt.description && opt.description.toLowerCase().includes(search.toLowerCase()))
        )
      : options;

    // Scroll active item into view
    useEffect(() => {
      if (isOpen && activeIndex >= 0 && listRef.current) {
        const items = listRef.current.querySelectorAll<HTMLDivElement>("[data-select-item]");
        if (items[activeIndex]) {
          items[activeIndex].scrollIntoView({ block: "nearest" });
        }
      }
    }, [activeIndex, isOpen]);

    const handleSelect = (val: string) => {
      onChange?.({ target: { value: val } });
      setIsOpen(false);
      setSearch("");
      setActiveIndex(-1);
    };

    const handleInputFocus = () => {
      if (disabled) return;
      updatePosition();
      setIsOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      updatePosition();
      if (!isOpen) setIsOpen(true);
      setActiveIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
          e.preventDefault();
          updatePosition();
          setIsOpen(true);
          return;
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isOpen && activeIndex >= 0 && filteredOptions[activeIndex]) {
          const opt = filteredOptions[activeIndex];
          if (!opt.disabled) handleSelect(opt.value);
        } else if (isOpen && filteredOptions.length > 0) {
          const firstValid = filteredOptions.find((o) => !o.disabled);
          if (firstValid) handleSelect(firstValid.value);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        setSearch("");
        setActiveIndex(-1);
        inputRef.current?.blur();
      } else if (e.key === "Tab") {
        setIsOpen(false);
        setSearch("");
        setActiveIndex(-1);
      }
    };

    // Calculate display value inside trigger input
    // If open and searching, show search text; otherwise show selected option's label
    const displayValue = isOpen ? search : (selectedOption ? selectedOption.label : "");

    return (
      <div className="w-full relative" ref={containerRef}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight"
          >
            {label.replace(/\s*\*+$/, "")}
            {(required || label.trim().endsWith("*")) && (
              <span className="text-rose-500 font-bold ml-1" title="Required field">*</span>
            )}
          </label>
        )}

        {/* Combobox Trigger: Direct In-Place Input */}
        <div
          ref={ref}
          className={cn(
            "group w-full rounded-xl text-xs sm:text-sm transition-all duration-150 relative",
            "bg-white border shadow-2xs flex items-center gap-2 cursor-pointer",
            error
              ? "border-rose-300 ring-1 ring-rose-200"
              : isOpen
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200/90 hover:border-slate-300",
            disabled && "opacity-60 cursor-not-allowed bg-slate-50",
            className
          )}
          onClick={() => {
            if (!disabled) {
              if (!isOpen) {
                updatePosition();
                setIsOpen(true);
              }
              inputRef.current?.focus();
            }
          }}
          {...props}
        >
          {/* Selected Option Icon (e.g. Jira Priority Icon, Status, Avatar) */}
          {selectedOption?.icon && !search && (
            <span className="pl-3 flex items-center shrink-0 pointer-events-none text-slate-600">
              {selectedOption.icon}
            </span>
          )}

          {/* In-place Editable Input (Allows Typing to Search Right Here) */}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            disabled={disabled}
            value={displayValue}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              if (disabled) return;
              if (!isOpen) {
                updatePosition();
                setIsOpen(true);
              }
            }}
            className={cn(
              "w-full py-2 bg-transparent text-slate-800 text-xs sm:text-sm focus:outline-none truncate",
              selectedOption?.icon && !search ? "pl-0 pr-2" : "px-3",
              !selectedOption && !search && "placeholder:text-slate-400"
            )}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Right Action Icons: Clear / Chevron */}
          <div className="flex items-center gap-1 pr-2.5 shrink-0">
            {search && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}

            <button
              type="button"
              tabIndex={-1}
              aria-label="Toggle dropdown"
              onClick={(e) => {
                e.stopPropagation();
                if (disabled) return;
                if (isOpen) {
                  setIsOpen(false);
                } else {
                  updatePosition();
                  setIsOpen(true);
                  inputRef.current?.focus();
                }
              }}
              className={cn(
                "p-0.5 rounded text-slate-400 hover:text-slate-600 transition-transform duration-200 cursor-pointer focus:outline-none",
                isOpen && "rotate-180 text-indigo-600"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Portal Dropdown Menu: Clean Jira-style List */}
        {isOpen && rect && !disabled && typeof window !== "undefined" && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[99999] bg-white border border-slate-200/95 rounded-xl shadow-xl overflow-hidden flex flex-col animate-fade-in"
            style={{
              top: (() => {
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownHeight = 240;
                if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                  return undefined;
                }
                return rect.bottom + 4;
              })(),
              bottom: (() => {
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownHeight = 240;
                if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                  return window.innerHeight - rect.top + 4;
                }
                return undefined;
              })(),
              left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
              width: rect.width,
              minWidth: "180px",
            }}
          >
            <div
              ref={listRef}
              className="overflow-y-auto p-1 max-h-60 divide-y divide-slate-50/50"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-400 text-center flex flex-col items-center gap-1">
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>No matching options</span>
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === String(value);
                  const isHighlighted = idx === activeIndex;

                  return (
                    <div
                      key={opt.value}
                      data-select-item
                      className={cn(
                        "group/item px-2.5 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2.5",
                        opt.disabled
                          ? "opacity-45 cursor-not-allowed text-slate-400"
                          : isHighlighted
                          ? "bg-indigo-50/80 text-indigo-900"
                          : isSelected
                          ? "bg-indigo-50/60 text-indigo-800 font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      )}
                      onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!opt.disabled) handleSelect(opt.value);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {opt.icon && (
                          <span className="shrink-0 flex items-center">
                            {opt.icon}
                          </span>
                        )}
                        <span className="truncate">{opt.label}</span>
                      </div>

                      {/* Right Selected Checkmark indicator */}
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-indigo-600 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  );
                })
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

