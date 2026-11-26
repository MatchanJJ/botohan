import { Suspense } from "react";
import { PresentView } from "@/components/PresentView";

// Projector view: no header or wallet UI (APP_FLOW.md Flow 3).
export default function PresentPage() {
  return (
    <Suspense fallback={<p className="p-8 text-grey">Loading poll…</p>}>
      <PresentView />
    </Suspense>
  );
}
