"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface InputModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (val: string) => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function Modal({ isOpen, title, onClose, onSubmit }: InputModalProps) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setVal("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Trap keyboard inside modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim() !== "") {
      onSubmit(val);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-content"
        ref={modalRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <h3 className="modal-title">{title}</h3>
          <input
            ref={inputRef}
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="modal-input"
            placeholder="Type here..."
          />
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [focusedBtn, setFocusedBtn] = useState<"cancel" | "confirm">("cancel");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFocusedBtn("cancel");
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside confirm modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Tab"
      ) {
        e.preventDefault();
        setFocusedBtn((prev) => {
          const next = prev === "cancel" ? "confirm" : "cancel";
          if (next === "cancel") cancelRef.current?.focus();
          else confirmRef.current?.focus();
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (focusedBtn === "confirm") {
          onConfirm();
          onClose();
        } else {
          onClose();
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onConfirm();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedBtn, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-content modal-confirm"
        ref={modalRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon">
          <AlertTriangle size={32} />
        </div>
        <h3 className="modal-title" style={{ textAlign: "center" }}>
          {title}
        </h3>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions" style={{ justifyContent: "center" }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className={`btn ${focusedBtn === "cancel" ? "btn-focused" : ""}`}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`btn btn-danger ${focusedBtn === "confirm" ? "btn-focused" : ""}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
