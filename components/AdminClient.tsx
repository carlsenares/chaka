"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Check, FileUp, LinkIcon, RefreshCw, Trash2, X } from "lucide-react";

type SourceQueue = {
  summary: Record<string, number>;
  items: SourceItem[];
};

type SourceItem = {
  review_item_id: string;
  source_kind: string;
  name: string;
  provider: string;
  source_url: string | null;
  queue_status: "pending_review" | "approved" | "rejected" | "blocked" | "monitored";
  review_priority: "low" | "medium" | "high";
  review_reason: string | null;
  source_metadata: Record<string, unknown>;
  ingestion: {
    can_trigger: boolean;
    commands: string[];
    blocker: string | null;
    last_run: Record<string, unknown> | null;
  };
};

type Investment = {
  investment_id: string;
  name: string;
  region: string;
  zone: string;
  woreda: string;
  intervention: string;
  status: string;
  area_ha: number;
  current_score: number;
  baseline_score: number;
  summary: string;
};

type InvestmentOptions = {
  regions: string[];
  sites: Array<{
    site_id: string;
    region: string;
    zone: string;
    woreda: string;
    priority_score: number;
    recommended_intervention: string;
  }>;
};

type AdminTab = "sources" | "upload" | "investments";

const ADMIN_PASSWORD = "4dmin!";

export function AdminClient() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("sources");
  const [queue, setQueue] = useState<SourceQueue | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [options, setOptions] = useState<InvestmentOptions>({ regions: [], sites: [] });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      setMessage("Wrong admin password.");
      return;
    }
    setAuthorized(true);
    setMessage(null);
    await Promise.all([loadSources(password), loadInvestments(password)]);
  }

  async function loadSources(secret = password) {
    const response = await fetch("/api/admin/source-review", {
      headers: { "x-admin-password": secret },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Could not load source queue.");
    setQueue((await response.json()) as SourceQueue);
  }

  async function loadInvestments(secret = password) {
    const response = await fetch("/api/admin/investments", {
      headers: { "x-admin-password": secret },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Could not load investments.");
    const payload = (await response.json()) as { investments: Investment[]; options: InvestmentOptions };
    setInvestments(payload.investments);
    setOptions(payload.options);
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-base px-5 py-6 text-fg">
        <section className="mx-auto mt-24 max-w-md rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <img className="brand-tree admin-login-tree" src="/brand/chaka-tree.png" alt="" />
            <div>
              <div className="brand-lockup">
                <span className="brand-wordmark">chaka</span>
              </div>
              <h1 className="text-2xl font-semibold">Chaka operations</h1>
            </div>
          </div>
          <form className="grid gap-3" onSubmit={login}>
            <label className="grid gap-1 text-sm font-semibold">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-md border border-[#cfc2aa] bg-white px-3 py-2 text-base outline-none focus:border-accent"
                autoFocus
              />
            </label>
            <button className="rounded-md bg-accent px-4 py-2 font-semibold text-white" type="submit">
              Enter admin
            </button>
            {message && <p className="text-sm text-[#9a3d2f]">{message}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base px-4 py-5 text-fg sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="flex flex-col gap-4 border-b border-[#d9d0bd] pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="brand-lockup">
              <img className="brand-tree brand-tree-sm" src="/brand/chaka-tree.png" alt="" />
              <span className="brand-wordmark">chaka</span>
            </div>
            <h1 className="mt-1 text-3xl font-semibold leading-tight sm:text-4xl">Source and investment control</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-[#cfc2aa] px-4 py-2 text-sm" href="/">
              Main dashboard
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[#cfc2aa] bg-surface px-4 py-2 text-sm"
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await Promise.all([loadSources(), loadInvestments()]).finally(() => setBusy(false));
              }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </nav>
        </header>

        <div className="flex flex-wrap gap-2">
          <TabButton active={activeTab === "sources"} onClick={() => setActiveTab("sources")}>
            New sources
          </TabButton>
          <TabButton active={activeTab === "upload"} onClick={() => setActiveTab("upload")}>
            Upload
          </TabButton>
          <TabButton active={activeTab === "investments"} onClick={() => setActiveTab("investments")}>
            Investment development
          </TabButton>
        </div>

        {message && (
          <div className="rounded-md border border-[#d9d0bd] bg-surface px-4 py-3 text-sm text-muted">
            {message}
          </div>
        )}

        {activeTab === "sources" && (
          <SourcesTab
            queue={queue}
            busy={busy}
            setBusy={setBusy}
            password={password}
            onQueue={setQueue}
            onMessage={setMessage}
          />
        )}
        {activeTab === "upload" && (
          <UploadTab password={password} setBusy={setBusy} busy={busy} onQueue={setQueue} onMessage={setMessage} />
        )}
        {activeTab === "investments" && (
          <InvestmentsTab
            password={password}
            investments={investments}
            options={options}
            setBusy={setBusy}
            busy={busy}
            onPayload={(payload) => {
              setInvestments(payload.investments);
              setOptions(payload.options);
            }}
            onMessage={setMessage}
          />
        )}
      </div>
    </main>
  );
}

function SourcesTab({
  queue,
  busy,
  setBusy,
  password,
  onQueue,
  onMessage,
}: {
  queue: SourceQueue | null;
  busy: boolean;
  setBusy: (value: boolean) => void;
  password: string;
  onQueue: (queue: SourceQueue) => void;
  onMessage: (message: string | null) => void;
}) {
  const sources = useMemo(
    () => (queue?.items ?? []).filter((item) => item.queue_status === "pending_review" || item.source_kind.includes("candidate") || item.source_kind.includes("upload")),
    [queue],
  );

  async function act(item: SourceItem, action: "approve" | "reject" | "block") {
    setBusy(true);
    onMessage(action === "approve" && item.ingestion.can_trigger ? "Approval started. Ingestion may take a moment." : null);
    const response = await fetch(`/api/admin/source-review/${encodeURIComponent(item.review_item_id)}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ action, reason: action === "approve" ? "Validated from admin dashboard." : "Rejected from admin dashboard." }),
    }).finally(() => setBusy(false));
    const payload = await response.json();
    if (!response.ok) {
      onMessage(payload.error ?? "Source action failed.");
      return;
    }
    onQueue(payload.queue as SourceQueue);
    onMessage(action === "approve" ? "Source validated. Ingestion ran if configured." : "Source decision saved.");
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-5">
        {["pending_review", "approved", "rejected", "blocked", "monitored"].map((key) => (
          <div key={key} className="rounded-lg border border-[#d9d0bd] bg-surface p-4">
            <p className="text-xs font-semibold uppercase text-accent">{key.replaceAll("_", " ")}</p>
            <p className="mt-2 text-3xl font-semibold">{queue?.summary?.[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        {sources.map((item) => (
          <article key={item.review_item_id} className="rounded-lg border border-[#d9d0bd] bg-surface p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#eef7f2] px-2 py-1 text-xs font-semibold uppercase text-accent">
                    {item.queue_status.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-md border border-[#d9d0bd] px-2 py-1 text-xs text-muted">
                    {item.review_priority} priority
                  </span>
                  <span className="rounded-md border border-[#d9d0bd] px-2 py-1 text-xs text-muted">
                    {String(item.source_metadata.license_status ?? "license unknown")}
                  </span>
                </div>
                <h2 className="truncate text-xl font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-muted">{item.provider}</p>
                {item.source_url && (
                  <a className="mt-2 inline-flex max-w-full items-center gap-2 truncate text-sm font-semibold text-accent" href={item.source_url} target="_blank">
                    <LinkIcon size={16} /> <span className="truncate">{item.source_url}</span>
                  </a>
                )}
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.review_reason ?? String(item.source_metadata.proposed_pipeline_role ?? "Review before use.")}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
                  <span>Use: {String(item.source_metadata.proposed_class ?? item.source_metadata.scoring_classification ?? "review")}</span>
                  <span>Access: {String(item.source_metadata.access_status ?? "unknown")}</span>
                  <span>{item.ingestion.can_trigger ? "Approval will run ingestion" : item.ingestion.blocker}</span>
                </div>
              </div>
              <div className="grid content-start gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={() => act(item, "approve")}
                >
                  <Check size={16} /> Validate
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfc2aa] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  onClick={() => act(item, "reject")}
                >
                  <X size={16} /> Reject
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d7b8a8] bg-[#fff8f3] px-4 py-2 text-sm font-semibold text-[#8c3d2f] disabled:opacity-50"
                  onClick={() => act(item, "block")}
                >
                  <Trash2 size={16} /> Block
                </button>
              </div>
            </div>
          </article>
        ))}
        {!sources.length && (
          <div className="rounded-lg border border-[#d9d0bd] bg-surface p-8 text-center text-muted">
            No new or pending sources.
          </div>
        )}
      </div>
    </section>
  );
}

function UploadTab({
  password,
  setBusy,
  busy,
  onQueue,
  onMessage,
}: {
  password: string;
  setBusy: (value: boolean) => void;
  busy: boolean;
  onQueue: (queue: SourceQueue) => void;
  onMessage: (message: string | null) => void;
}) {
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const formData = new FormData();
    formData.set("source", source);
    formData.set("note", note);
    if (file) formData.set("file", file);
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      headers: { "x-admin-password": password },
      body: formData,
    }).finally(() => setBusy(false));
    const payload = await response.json();
    if (!response.ok) {
      onMessage(payload.error ?? "Upload failed.");
      return;
    }
    onQueue(payload.queue as SourceQueue);
    setSource("");
    setNote("");
    setFile(null);
    onMessage("Source uploaded to the validation queue.");
  }

  return (
    <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-[#eef7f2] text-accent">
          <FileUp size={21} />
        </span>
        <div>
          <h2 className="text-2xl font-semibold">Add a source</h2>
          <p className="text-sm text-muted">Paste a URL or choose a PDF/DOCX in the same review form.</p>
        </div>
      </div>
      <form className="grid gap-4" onSubmit={submit}>
        <label className="grid gap-1 text-sm font-semibold">
          Source URL or file
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="https://provider.org/dataset or leave empty and choose a file"
            className="rounded-md border border-[#cfc2aa] bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.geojson"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="rounded-md border border-dashed border-[#cfc2aa] bg-white px-3 py-3 text-sm"
        />
        <label className="grid gap-1 text-sm font-semibold">
          What should we use from it?
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Example: use this for soil observation validation in Southwest Ethiopia, not direct scoring until checked."
            className="resize-none rounded-md border border-[#cfc2aa] bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <button disabled={busy} className="w-fit rounded-md bg-accent px-5 py-2 font-semibold text-white disabled:opacity-50">
          Add to validation queue
        </button>
      </form>
    </section>
  );
}

function InvestmentsTab({
  password,
  investments,
  options,
  setBusy,
  busy,
  onPayload,
  onMessage,
}: {
  password: string;
  investments: Investment[];
  options: InvestmentOptions;
  setBusy: (value: boolean) => void;
  busy: boolean;
  onPayload: (payload: { investments: Investment[]; options: InvestmentOptions }) => void;
  onMessage: (message: string | null) => void;
}) {
  const [region, setRegion] = useState(options.regions[0] ?? "");
  const [intervention, setIntervention] = useState("Assisted natural regeneration and community protection");
  const regionSites = options.sites.filter((site) => site.region === region);
  const [siteId, setSiteId] = useState("");

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/admin/investments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ region, intervention, site_id: siteId || undefined }),
    }).finally(() => setBusy(false));
    const payload = await response.json();
    if (!response.ok) {
      onMessage(payload.error ?? "Could not add investment.");
      return;
    }
    onPayload(payload as { investments: Investment[]; options: InvestmentOptions });
    onMessage("Investment added and update note created.");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      <form className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm" onSubmit={add}>
        <h2 className="text-2xl font-semibold">Add investment</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold">
            Region
            <select
              value={region}
              onChange={(event) => {
                setRegion(event.target.value);
                setSiteId("");
              }}
              className="rounded-md border border-[#cfc2aa] bg-white px-3 py-2"
            >
              {options.regions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Area
            <select value={siteId} onChange={(event) => setSiteId(event.target.value)} className="rounded-md border border-[#cfc2aa] bg-white px-3 py-2">
              <option value="">Best matching area</option>
              {regionSites.map((site) => (
                <option key={site.site_id} value={site.site_id}>
                  {site.woreda}, {site.zone} ({site.priority_score})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            What investment was done?
            <textarea
              value={intervention}
              onChange={(event) => setIntervention(event.target.value)}
              rows={4}
              className="resize-none rounded-md border border-[#cfc2aa] bg-white px-3 py-2"
            />
          </label>
          <button disabled={busy} className="rounded-md bg-accent px-4 py-2 font-semibold text-white disabled:opacity-50">
            Add investment
          </button>
        </div>
      </form>

      <div className="grid gap-3">
        {investments.map((investment) => (
          <Link
            key={investment.investment_id}
            href={`/admin/investments/${encodeURIComponent(investment.investment_id)}`}
            className="grid gap-3 rounded-lg border border-[#d9d0bd] bg-surface p-4 shadow-sm transition hover:bg-[#fbf7ee] sm:grid-cols-[minmax(0,1fr)_120px]"
          >
            <div className="min-w-0">
              <h3 className="truncate text-xl font-semibold">{investment.name}</h3>
              <p className="mt-1 text-sm lowercase text-muted">{investment.intervention}</p>
              <p className="mt-3 text-sm text-muted">{investment.summary}</p>
            </div>
            <div className="grid content-start gap-1 text-right">
              <span className="text-3xl font-semibold text-accent">{investment.current_score}</span>
              <span className="text-xs uppercase text-muted">current score</span>
              <span className="mt-2 text-xs text-muted">{Math.round(investment.area_ha).toLocaleString()} ha</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`rounded-md border px-4 py-2 text-sm font-semibold ${
        active ? "border-accent bg-[#eef7f2] text-accent" : "border-[#cfc2aa] bg-surface text-muted"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
