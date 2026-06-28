import { loadLocalKnowledgeCatalog } from "../_lib/local-knowledge";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function KnowledgeSourcesPage() {
  const catalog = await loadLocalKnowledgeCatalog();

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-accent">Sources</p>
        <h2 className="mt-2 text-2xl font-semibold">Local knowledge source catalog</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          This page reads data/local_knowledge/sources.json when it exists and falls back to an
          empty state when there is nothing to show yet.
        </p>
      </div>

      {catalog.error ? (
        <StatePanel title="Catalog error">
          <p className="text-sm leading-6 text-muted">{catalog.error}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            The page handled the parse failure without touching any scoring or recommendation
            routes.
          </p>
        </StatePanel>
      ) : catalog.sourceCount > 0 ? (
        <div className="grid gap-4">
          <StatePanel title="Catalog summary">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryStat label="Sources" value={String(catalog.sourceCount)} />
              <SummaryStat label="File" value={catalog.exists ? "Found" : "Missing"} />
              <SummaryStat label="Mode" value="Local read" />
              <SummaryStat label="Scope" value="Admin only" />
            </div>
          </StatePanel>

          <div className="grid gap-4">
            {catalog.sources.map((source) => (
              <article
                key={source.sourceId}
                className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-[#d9d0bd] pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase text-accent">{source.sourceId}</p>
                    <h3 className="mt-2 text-xl font-semibold">{source.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {source.location ?? "No geography metadata found"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Pill>{source.sourceStatus}</Pill>
                    {source.sourceType && <Pill>{source.sourceType}</Pill>}
                    {source.year && <Pill>{source.year}</Pill>}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <Detail label="Authors" value={source.authors ?? "n/a"} />
                  <Detail label="Institution" value={source.institution ?? "n/a"} />
                  <Detail
                    label="Artifacts"
                    value={source.artifactSummary.length ? source.artifactSummary.join(" | ") : "none detected"}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <StatePanel title="Empty state">
          <p className="text-sm leading-6 text-muted">
            No local knowledge sources are available yet. When data/local_knowledge/sources.json is
            generated, this page will list each source and any stored processing artifacts.
          </p>
        </StatePanel>
      )}
    </section>
  );
}

function StatePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#cfc2aa] bg-[#fbf7ee] px-3 py-1 font-medium text-muted">
      {children}
    </span>
  );
}
