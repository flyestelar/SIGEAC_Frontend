'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function parseRequiredNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseOptionalInteger(value: string) {
  if (!value.trim()) return null;
  return Number.parseInt(value, 10);
}

export function toNumericInput(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return String(value);
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</span>;
}

export function ConfirmationField({
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  required = false,
  disabled = false,
  step,
  mono = false,
}: {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  step?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>
        {label}
        {required ? <span className="ml-1 text-sky-600 dark:text-sky-400">*</span> : null}
      </FieldLabel>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        step={step}
        className={cn('h-9', mono && 'font-mono')}
      />
    </div>
  );
}
