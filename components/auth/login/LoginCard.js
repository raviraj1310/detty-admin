"use client";

export default function LoginCard({ children, className = "" }) {
  return (
    <div className={`w-full max-w-md bg-white relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}