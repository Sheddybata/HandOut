import { Suspense } from "react";
import AIStudyAssistant from "@/components/AIStudyAssistant/AIStudyAssistant";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-4 text-slate-500">Loading…</div>}>
      <AIStudyAssistant />
    </Suspense>
  );
}
