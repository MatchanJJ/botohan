import { Header } from "@/components/Header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[880px] px-4 py-8">{children}</main>
    </>
  );
}
