import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-zinc-500 animate-spin mb-4" />
      <p className="text-sm text-zinc-400 font-medium animate-pulse">
        Loading...
      </p>
    </div>
  );
}
