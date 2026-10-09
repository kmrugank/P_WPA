import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, Moon, ArrowUpRight, ShieldCheck } from "lucide-react";
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Moon size={22} strokeWidth={1.5} />
      </span>
      <span>
        lunara<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </header>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <Moon size={32} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = before;
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="sheet"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="sheet-handle" />
      <div className="sheet-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="sheet-content">{children}</div>
    </dialog>,
    document.body,
  );
}
export function Info({ children }: { children: ReactNode }) {
  return (
    <div className="info">
      <ShieldCheck size={18} />
      <p>{children}</p>
    </div>
  );
}
export function Arrow() {
  return <ArrowUpRight size={17} />;
}
