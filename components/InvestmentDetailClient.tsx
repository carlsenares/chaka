"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

type Investment = {
  investment_id: string;
  name: string;
  region: string;
  zone: string;
  woreda: string;
  site_id: string;
  intervention: string;
  status: string;
  area_ha: number;
  summary: string;
  baseline_score: number;
  current_score: number;
  score_history: Array<{ year: number; score: number; why_changed: string }>;
  image_timeline: Array<{ year: number; label: string; image_url: string; note: string }>;
  update_note: string;
};

const ADMIN_PASSWORD = "4dmin!";

export function InvestmentDetailClient({ investmentId }: { investmentId: string }) {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(secret = password) {
    const response = await fetch(`/api/admin/investments/${encodeURIComponent(investmentId)}`, {
      headers: { "x-admin-password": secret },
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not load investment.");
      return;
    }
    setInvestment(payload.investment as Investment);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      setError("Wrong admin password.");
      return;
    }
    setAuthorized(true);
    setError(null);
    await load(password);
  }

  useEffect(() => {
    if (authorized) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, investmentId]);

  if (!authorized) {
    return (
      <main className="min-h-screen bg-base px-5 py-6 text-fg">
        <section className="mx-auto mt-24 max-w-md rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-md bg-[#1f6f68] text-white">
              <Shield size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Admin</p>
              <h1 className="text-2xl font-semibold">Investment detail</h1>
            </div>
          </div>
          <form className="grid gap-3" onSubmit={login}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-[#cfc2aa] bg-white px-3 py-2 text-base outline-none focus:border-accent"
              autoFocus
            />
            <button className="rounded-md bg-accent px-4 py-2 font-semibold text-white" type="submit">
              Enter admin
            </button>
            {error && <p className="text-sm text-[#9a3d2f]">{error}</p>}
          </form>
        </section>
      </main>
    );
  }

  if (!investment) {
    return <main className="min-h-screen bg-base p-8 text-fg">Loading investment...</main>;
  }

  const delta = investment.current_score - investment.baseline_score;

  return (
    <main className="min-h-screen bg-base px-5 py-6 text-fg sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-5">
        <header className="flex flex-col gap-4 border-b border-[#d9d0bd] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-accent">Investment development</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{investment.name}</h1>
            <p className="mt-2 max-w-3xl text-sm lowercase text-muted">{investment.intervention}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-[#cfc2aa] px-4 py-2 text-sm" href="/admin">
              Admin
            </Link>
            <Link className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white" href={`/recommendations/${encodeURIComponent(investment.site_id)}`}>
              Area analysis
            </Link>
          </nav>
        </header>

        <section className="grid gap-4 sm:grid-cols-4">
          <Metric label="Current score" value={investment.current_score} />
          <Metric label="Baseline score" value={investment.baseline_score} />
          <Metric label="Score change" value={`${delta >= 0 ? "+" : ""}${delta}`} />
          <Metric label="Area" value={`${Math.round(investment.area_ha).toLocaleString()} ha`} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Monitoring timeline</h2>
            <div className="mt-4 grid gap-4">
              {investment.image_timeline.map((image) => (
                <article key={`${image.year}-${image.label}`} className="overflow-hidden rounded-lg border border-[#d9d0bd] bg-white">
                  <img src={image.image_url} alt={`${image.label} ${image.year}`} className="h-72 w-full object-cover" />
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase text-accent">{image.year}</p>
                    <h3 className="text-lg font-semibold">{image.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{image.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Region</h2>
              <p className="mt-2 text-sm text-muted">{investment.region} / {investment.zone} / {investment.woreda}</p>
              <p className="mt-4 text-sm leading-6 text-muted">{investment.summary}</p>
            </section>
            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Score changes</h2>
              <div className="mt-4 grid gap-3">
                {investment.score_history.map((row) => (
                  <div key={row.year} className="rounded-md border border-[#e7deca] bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{row.year}</span>
                      <span className="text-lg font-semibold text-accent">{row.score}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{row.why_changed}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-lg border border-[#d9d0bd] bg-[#eef7f2] p-5">
              <h2 className="text-xl font-semibold">Update note</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{investment.update_note}</p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#d9d0bd] bg-surface p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-accent">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
