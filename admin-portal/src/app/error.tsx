"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-zinc-100 mb-2">Something went wrong!</h2>
      <p className="text-sm text-zinc-400 max-w-md mb-8">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button
        onClick={() => reset()}
        className="bg-zinc-100 text-zinc-900 hover:bg-white"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
