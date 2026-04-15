import React, { useState, useEffect } from 'react';

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    let message = "Something went wrong.";
    try {
      if (error.message) {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.operationType) {
          message = `Firestore ${parsed.operationType} error: ${parsed.error}`;
        }
      }
    } catch {
      message = error.message || message;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
          <h2 className="text-2xl font-display font-bold text-red-600 mb-4">Oops!</h2>
          <p className="text-slate-600 mb-6">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
