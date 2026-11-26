import { Suspense } from "react";
import { PollView } from "@/components/PollView";

// PollView reads the id with useParams, which needs Suspense under cacheComponents.
export default function PollPage() {
  return (
    <Suspense fallback={<p className="text-grey">Loading poll…</p>}>
      <PollView />
    </Suspense>
  );
}
