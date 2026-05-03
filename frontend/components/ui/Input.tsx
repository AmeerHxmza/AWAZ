import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, multiline, className = '', ...props }) => {
  const baseClass = `px-3 py-2.5 border rounded-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-navy)]/20 focus-visible:border-[var(--app-navy-muted)] w-full text-[15px] ${
    error ? 'border-red-400' : 'border-stone-300'
  } ${className}`;

  return (
    <div className="flex flex-col mb-4">
      {label && (
        <label className="mb-1.5 text-[13px] font-semibold text-stone-700">{label}</label>
      )}
      {multiline ? (
        <textarea className={`${baseClass} min-h-[120px] resize-y`} {...(props as any)} />
      ) : (
        <input className={baseClass} {...(props as any)} />
      )}
      {error && <span className="mt-1.5 text-sm text-red-700 font-medium">{error}</span>}
    </div>
  );
};
