"use client";

import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import type { ActionState } from "@/lib/types";

export function Feedback({ state }: { state: ActionState }) {
  if (!state.error && !state.success) return null;
  return (
    <div
      className={`feedback ${state.error ? "error" : "success"}`}
      role={state.error ? "alert" : "status"}
    >
      {state.error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{state.error ?? state.success}</span>
    </div>
  );
}

export function Submit({
  children,
  pendingText = "Procesando…",
  secondary = false,
}: {
  children: React.ReactNode;
  pendingText?: string;
  secondary?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`button ${secondary ? "secondary" : "primary"}`}
      disabled={pending}
    >
      {pending ? (
        <LoaderCircle className="spin" size={17} />
      ) : (
        <ArrowRight size={17} />
      )}
      {pending ? pendingText : children}
    </button>
  );
}
