// src/app/error.js
"use client";

export default function Error({ error, reset }) {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold">Something went wrong.</p>
      <p className="max-w-sm text-sm text-zinc-500">
        The page hit an unexpected error. This has been logged — try again.
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}