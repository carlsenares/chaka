import Link from "next/link";
import type { ReactNode } from "react";

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-5 sm:px-8">
        <header className="grid gap-4 border-b border-[#d9d0bd] pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-accent">Local knowledge</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-5xl">
              Admin intake surface
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              Local research sources stay separate from the scoring pipeline and can be reviewed
              here as intake artifacts, catalog snapshots, and lightweight processing status.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <NavLink href="/knowledge/upload">Upload</NavLink>
            <NavLink href="/knowledge/sources">Sources</NavLink>
          </nav>
        </header>

        {children}
      </div>
    </main>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="rounded-md border border-[#cfc2aa] px-4 py-2 text-sm transition hover:bg-[#fbf7ee]"
      href={href}
    >
      {children}
    </Link>
  );
}
