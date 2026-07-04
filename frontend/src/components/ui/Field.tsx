import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './Field.css';

type FieldWrapperProps = {
  label?: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, hint, children }: FieldWrapperProps) {
  return (
    <label className="ds-field">
      {label && <span className="ds-field-label">{label}</span>}
      {children}
      {hint && <span className="ds-field-hint">{hint}</span>}
    </label>
  );
}

export function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="ds-field-control" {...props} />;
}

export function FieldTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="ds-field-control ds-field-textarea" {...props} />;
}

export function FieldSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="ds-field-control" {...props} />;
}
