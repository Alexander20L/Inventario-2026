import Link from "next/link";
import { ArrowRight, Boxes, Leaf, Package } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${compact ? "compact" : ""}`}
      aria-label="EN STOCK, inicio"
    >
      <span className="brand-icon">
        <Boxes size={21} strokeWidth={1.6} />
      </span>
      <span>
        EN STOCK<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function ProductArt() {
  return (
    <div className="product-art" aria-hidden="true">
      <div className="art-orbit" />
      <div className="art-leaf">
        <Leaf size={25} />
      </div>
      <div className="product-bag coffee">
        <div className="bag-label">
          <Leaf size={26} strokeWidth={1.5} />
          <strong>CAFÉ</strong>
          <span>MOLIDO · 250 g</span>
          <div className="mini-barcode" />
        </div>
      </div>
      <div className="product-bag rice">
        <div className="bag-label">
          <Package size={23} strokeWidth={1.3} />
          <strong>ARROZ</strong>
          <span>INTEGRAL · 1 kg</span>
        </div>
      </div>
      <span className="art-stock">
        <span className="status-dot" /> Todo en su lugar
      </span>
    </div>
  );
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const inputId = props.id ?? props.name;
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
      />
      {hint && (
        <span className="field-hint" id={`${inputId}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Callout({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: "green" | "amber";
}) {
  return <div className={`callout ${tone}`}>{children}</div>;
}

export function ActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-link">
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
