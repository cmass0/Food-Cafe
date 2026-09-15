"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  disabled?: boolean;
  error?: string;
};

export default function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  disabled = false,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="group absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:pointer-events-none disabled:opacity-50"
          aria-label={`${label} ${visible ? "숨기기" : "보기"}`}
          aria-pressed={visible}
        >
          {visible ? (
            <span className="grid h-8 w-8 place-items-center rounded-md transition group-hover:bg-zinc-100 group-hover:text-zinc-700">
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-md transition group-hover:bg-zinc-100 group-hover:text-zinc-700">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
