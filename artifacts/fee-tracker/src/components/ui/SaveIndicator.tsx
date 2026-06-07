import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { SaveStatus } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  status: SaveStatus | null;
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (!status) return null;

  const config = {
    saved: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: "Saved",
      className: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800",
    },
    saving: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: "Saving…",
      className: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: "Save error",
      className: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    },
  }[status];

  return (
    <div
      data-testid="save-indicator"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all duration-300",
        config.className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
