import { PollList } from "@/components/PollList";

export default function Home() {
  return (
    <>
      <h1 className="mb-6 font-display text-[28px] leading-tight">Polls</h1>
      <PollList />
    </>
  );
}
