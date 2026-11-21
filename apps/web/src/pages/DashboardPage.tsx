import { useAuth } from "../lib/auth-context";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="bg-slate-900 p-6 text-white md:min-h-screen md:w-64">
        <h1 className="text-2xl font-bold">SupportDesk</h1>
        <nav aria-label="Main navigation" className="mt-8">
          <span className="block rounded-lg bg-blue-600 px-4 py-3">
            Dashboard
          </span>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-4 border-b bg-white p-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Dashboard
            </h2>
            <p className="text-sm text-slate-500">
              Welcome, {user?.name}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Logout
          </button>
        </header>

        <main className="p-6">
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Your Workspace
            </h3>
            <p className="mt-3 text-slate-600">
              You are successfully signed in to SupportDesk.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Ticket management features will appear here.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
