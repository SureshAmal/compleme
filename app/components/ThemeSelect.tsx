"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const options = [
  { value: "zed", label: "Zed Theme" },
  { value: "vscode", label: "VS Code" },
  { value: "github", label: "GitHub" },
  { value: "sunset", label: "Sunset" },
  { value: "sea", label: "Sea Break" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "monokai", label: "Monokai" },
  { value: "solarized-light", label: "Solarized Light" },
  { value: "light-plus", label: "VS Light+" },
  { value: "catppuccin-latte", label: "Catppuccin Latte" },
];

export function ThemeSelect({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (val: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === theme) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const el = document.getElementById(`theme-option-${focusedIndex}`);
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen && focusedIndex >= 0) {
        setTheme(options[focusedIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen(!isOpen);
        setFocusedIndex(options.findIndex((o) => o.value === theme));
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setFocusedIndex(0);
      } else {
        setFocusedIndex((prev) => (prev + 1) % options.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setFocusedIndex(options.length - 1);
      } else {
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="custom-select-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className="custom-select-trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          setFocusedIndex(options.findIndex((o) => o.value === theme));
        }}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          size={16}
          className={`custom-select-icon ${isOpen ? "open" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((opt, idx) => (
            <div
              id={`theme-option-${idx}`}
              key={opt.value}
              className={`custom-select-item ${theme === opt.value ? "selected" : ""} ${focusedIndex === idx ? "focused" : ""}`}
              onClick={() => {
                setTheme(opt.value);
                setIsOpen(false);
              }}
              onMouseEnter={() => setFocusedIndex(idx)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
