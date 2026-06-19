import { A, createAsync, useSearchParams } from "@solidjs/router"
import { For, Show } from "solid-js"
import { adminOverview, adminSearch } from "./actions"
import { AdminState } from "./state"

function formatMoney(value?: number | null) {
  return `$${((value ?? 0) / 100000000).toFixed(2)}`
}

export function AdminHome() {
  const [params] = useSearchParams()
  const overviewResult = createAsync(() => adminOverview())
  const searchResult = createAsync(() => adminSearch(String(params.q ?? "")))
  const overview = () => overviewResult()?.data
  const results = () => searchResult()?.data
  const error = () => overviewResult()?.error ?? searchResult()?.error
  const pending = () => !overviewResult() || !searchResult()

  return (
    <>
      <header data-slot="admin-header">
        <div>
          <p data-slot="eyebrow">Zingpop Admin</p>
          <h1>User Data Backend</h1>
        </div>
        <form method="get" data-slot="search-form">
          <input name="q" value={String(params.q ?? "")} placeholder="Search account, phone, email, workspace, key" />
          <button>Search</button>
        </form>
      </header>

      <Show when={!pending()} fallback={<AdminState title="Checking admin access" message="Loading the admin backend." />}>
        <Show when={!error()} fallback={<AdminState title="Admin access required" message={error() ?? ""} />}>
          <section data-slot="metrics">
            <div>
              <span>Accounts</span>
              <strong>{overview()?.accounts ?? "-"}</strong>
            </div>
            <div>
              <span>Active users</span>
              <strong>{overview()?.activeUsers ?? "-"}</strong>
            </div>
            <div>
              <span>Deleted users</span>
              <strong>{overview()?.deletedUsers ?? "-"}</strong>
            </div>
            <div>
              <span>Workspaces</span>
              <strong>{overview()?.activeWorkspaces ?? "-"}</strong>
            </div>
            <div>
              <span>Subscriptions</span>
              <strong>{(overview()?.activeBlackSubscriptions ?? 0) + (overview()?.activeLiteSubscriptions ?? 0)}</strong>
            </div>
            <div>
              <span>Total balance</span>
              <strong>{formatMoney(overview()?.totalBalance)}</strong>
            </div>
          </section>

          <section data-slot="admin-section">
            <div data-slot="section-title">
              <h2>Search Results</h2>
              <p>Open an account or workspace to inspect identity, membership, billing, usage, keys, projects, and audit.</p>
            </div>
            <div data-slot="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>User</th>
                    <th>Workspace</th>
                    <th>Auth</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <Show
                    when={(results()?.length ?? 0) > 0}
                    fallback={
                      <tr>
                        <td colspan="6">Search for a user, workspace, phone, email, or API key.</td>
                      </tr>
                    }
                  >
                    <For each={results()}>
                      {(row) => (
                        <tr>
                          <td>
                            <A href={`/admin/${row.accountID}`}>{row.accountID}</A>
                          </td>
                          <td>{row.userID}</td>
                          <td>
                            <A href={`/admin/${row.workspaceID}`}>{row.workspaceName}</A>
                            <small>{row.workspaceID}</small>
                          </td>
                          <td>
                            <span>{row.authProvider ?? "-"}</span>
                            <small>{row.authSubject ?? ""}</small>
                          </td>
                          <td>{formatMoney(row.balance)}</td>
                          <td>
                            {row.userDeleted || row.workspaceDeleted ? "deleted" : "active"}
                            {row.blackSubscriptionID ? " / Black" : ""}
                            {row.liteSubscriptionID ? " / Lite" : ""}
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>
          </section>
        </Show>
      </Show>
    </>
  )
}
