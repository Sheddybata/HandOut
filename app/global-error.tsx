"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-6 text-center max-w-md">
            An error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-intermediate bg-trust-blue text-white font-medium hover:bg-trust-blue/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
