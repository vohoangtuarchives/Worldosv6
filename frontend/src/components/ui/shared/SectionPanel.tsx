'use client';

interface SectionPanelProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionPanel({ children, className = '' }: SectionPanelProps) {
  return (
    <div className={`rounded-[32px] border border-slate-800 bg-slate-950/40 p-8 ${className}`}>
      {children}
    </div>
  );
}
