export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
        default scaffold
      </span>
      <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl">
        Ship the idea,
        <br />
        not the boilerplate.
      </h1>
      <p className="max-w-xl text-lg text-muted">
        Frontend, deploy, design system and CI — already decided. Paste your brief
        into <code className="text-accent">BRIEF.md</code> and build.
      </p>
      <a
        href="https://github.com/carlsenares/default"
        className="mt-4 rounded-full bg-accent px-6 py-3 font-medium text-black transition hover:opacity-90"
      >
        View the repo
      </a>
    </main>
  );
}
