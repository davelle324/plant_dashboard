export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8 md:px-10">
      <p className="text-sm uppercase tracking-[0.3em] text-moss">Settings</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">Account settings</h1>
      <div className="mt-8 rounded-[2rem] bg-white/75 p-6 shadow-soft">
        <p className="text-sm text-slate-600">
          Clerk integration, notification settings, and future AI preferences belong here.
        </p>
      </div>
    </main>
  );
}

