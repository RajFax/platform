// src/components/ui/Card.tsx
import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}
