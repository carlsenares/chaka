import { loadLocalKnowledgeCatalog } from "../_lib/local-knowledge";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const stages = [
  {
    name: "Upload intake",
    status: "Local mock",
    detail: "Disabled form only; no backend write is wired up on this surface.",
  },
  {
    name: "PDF to markdown",
    status: "Queued",
    detail: "Expected output under data/local_knowledge/markdown/{source_id}/.",
  },
  {
    name: "Document analysis",
    status: "Queued",
    detail: "Use this to classify scope, confidence, and blocked uses.",
  },
  {
    name: "Evidence cards",
    status: "Queued",
    detail: "Page-level claims stay separate from scoring features.",
  },
  {
    name: "Catalog snapshot",
    status: "Optional",
    detail: "sources.json is read only if it already exists locally.",
  },
];

export default async function KnowledgeUploadPage() {
  const catalog = await loadLocalKnowledgeCatalog();

  return (
    <section className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-accent">Upload intake</p>
          <h2 className="mt-2 text-2xl font-semibold">Local-only source submission mock</h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            This surface explains the intake flow for local research, but it does not accept
            production uploads. The form is intentionally disabled so the page can be used as an
            admin reference while processing artifacts are developed or reviewed.
          </p>

          <form className="mt-6 grid gap-4">
            <fieldset disabled className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Title" placeholder="Thesis, report, or paper title" />
                <Field label="Authors" placeholder="Optional author names" />
                <Field label="Year" placeholder="2026" />
                <Field label="Institution" placeholder="University, NGO, or project" />
                <Field label="Source type" placeholder="Peer-reviewed paper, thesis, report" />
                <Field label="Region / zone / woreda" placeholder="Optional geography hint" />
              </div>
              <Field label="DOI or URL" placeholder="Optional source link" />
              <label className="grid gap-2 text-sm">
                <span className="text-muted">Notes</span>
                <textarea
                  className="min-h-28 rounded-md border border-[#d9d0bd] bg-[#fbf7ee] px-3 py-2 text-sm text-fg placeholder:text-muted/70"
                  placeholder="Permissions, extraction notes, review status, or local caveats."
                  readOnly
                />
              </label>
              <label className="flex items-start gap-3 rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-3 text-sm">
                <input
                  className="mt-1 size-4 rounded border-[#cfc2aa] bg-transparent"
                  disabled
                  defaultChecked={false}
                  type="checkbox"
                />
                <span className="leading-6 text-muted">
                  Uploader has permission to use this document for internal review.
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white opacity-60"
                  disabled
                  type="button"
                >
                  Submit intake
                </button>
                <button
                  className="rounded-md border border-[#cfc2aa] px-4 py-2 text-sm text-muted"
                  disabled
                  type="button"
                >
                  Save draft
                </button>
              </div>
            </fieldset>
          </form>
        </article>

        <aside className="grid gap-4">
          <InfoCard title="Current intake state">
            <Stat label="Surface" value="Local-only" />
            <Stat label="Backend" value="Not wired" />
            <Stat label="Catalog file" value={catalog.exists ? "Present" : "Missing"} />
            <Stat label="Parsed sources" value={String(catalog.sourceCount)} />
          </InfoCard>

          <InfoCard title="Status rail">
            <div className="grid gap-3">
              {stages.map((stage) => (
                <div key={stage.name} className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{stage.name}</span>
                    <span className="rounded-full border border-[#cfc2aa] px-2 py-1 text-xs text-muted">
                      {stage.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{stage.detail}</p>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="Filesystem note">
            <p className="text-sm leading-6 text-muted">
              Expected local artifacts live under data/local_knowledge/, including sources.json,
              document analyses, evidence cards, and page text markdown.
            </p>
          </InfoCard>
        </aside>
      </div>

      <InfoCard title="Review checklist">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CheckItem title="Metadata capture" text="Title, author, year, and institution." />
          <CheckItem title="Permission check" text="Internal use must be explicitly allowed." />
          <CheckItem title="Traceable output" text="Keep source_id and upload_id attached." />
          <CheckItem title="Separation" text="Do not let intake artifacts overwrite scores." />
        </div>
      </InfoCard>

      {catalog.exists ? (
        <InfoCard title="Local snapshot">
          <p className="text-sm leading-6 text-muted">
            A sources.json file exists locally, so the sources page can show a catalog snapshot.
          </p>
        </InfoCard>
      ) : (
        <InfoCard title="Local snapshot">
          <p className="text-sm leading-6 text-muted">
            No sources.json file is present yet. The sources page will show an empty state until a
            local catalog is generated.
          </p>
        </InfoCard>
      )}
    </section>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <input
        className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] px-3 py-2 text-sm text-fg placeholder:text-muted/70"
        placeholder={placeholder}
        readOnly
        type="text"
      />
    </label>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#d9d0bd] pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CheckItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
