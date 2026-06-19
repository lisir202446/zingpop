import { createAsync, useParams } from "@solidjs/router"
import { For, Show } from "solid-js"
import {
  adjustWorkspaceBalance,
  adminAccountDetail,
  adminWorkspaceDetail,
  cancelWorkspaceSubscription,
  disableWorkspaceReload,
  setUserDeleted,
  setUserMonthlyLimit,
  setWorkspaceDeleted,
  setWorkspaceMonthlyLimit,
} from "./actions"
import { AdminHome } from "./home"
import { adminErrorTitle } from "./result"
import { AdminState } from "./state"
import "./index.css"

function formatMoney(value?: number | null) {
  return `$${((value ?? 0) / 100000000).toFixed(2)}`
}

function ReasonInput() {
  return <input name="reason" placeholder="Reason, at least 6 characters" required minlength="6" />
}

function WorkspaceOperations(props: { workspaceID: string; billing?: { subscriptionID?: string | null; liteSubscriptionID?: string | null } | null }) {
  return (
    <section data-slot="admin-section">
      <div data-slot="section-title">
        <h2>Operations</h2>
        <p>Every operation writes an admin audit entry.</p>
      </div>
      <div data-slot="operation-grid">
        <form action={adjustWorkspaceBalance} method="post" data-slot="operation">
          <input type="hidden" name="workspaceID" value={props.workspaceID} />
          <strong>Adjust balance</strong>
          <input name="amount" type="number" step="0.01" placeholder="Signed dollar amount" required />
          <ReasonInput />
          <button>Apply</button>
        </form>
        <form action={setWorkspaceMonthlyLimit} method="post" data-slot="operation">
          <input type="hidden" name="workspaceID" value={props.workspaceID} />
          <strong>Workspace monthly limit</strong>
          <input name="monthlyLimit" type="number" min="0" step="1" placeholder="Blank means no limit" />
          <ReasonInput />
          <button>Set</button>
        </form>
        <form action={disableWorkspaceReload} method="post" data-slot="operation">
          <input type="hidden" name="workspaceID" value={props.workspaceID} />
          <strong>Disable auto reload</strong>
          <ReasonInput />
          <button>Disable</button>
        </form>
        <form action={setWorkspaceDeleted} method="post" data-slot="operation">
          <input type="hidden" name="workspaceID" value={props.workspaceID} />
          <input type="hidden" name="deleted" value="true" />
          <strong>Soft-delete workspace</strong>
          <ReasonInput />
          <button>Delete</button>
        </form>
        <form action={setWorkspaceDeleted} method="post" data-slot="operation">
          <input type="hidden" name="workspaceID" value={props.workspaceID} />
          <input type="hidden" name="deleted" value="false" />
          <strong>Restore workspace</strong>
          <ReasonInput />
          <button>Restore</button>
        </form>
        <Show when={props.billing?.subscriptionID}>
          <form action={cancelWorkspaceSubscription} method="post" data-slot="operation">
            <input type="hidden" name="workspaceID" value={props.workspaceID} />
            <input type="hidden" name="subscription" value="black" />
            <strong>Cancel Black subscription</strong>
            <ReasonInput />
            <button>Cancel Black</button>
          </form>
        </Show>
        <Show when={props.billing?.liteSubscriptionID}>
          <form action={cancelWorkspaceSubscription} method="post" data-slot="operation">
            <input type="hidden" name="workspaceID" value={props.workspaceID} />
            <input type="hidden" name="subscription" value="lite" />
            <strong>Cancel Lite subscription</strong>
            <ReasonInput />
            <button>Cancel Lite</button>
          </form>
        </Show>
      </div>
    </section>
  )
}

function WorkspaceDetail(props: { id: string }) {
  const result = createAsync(() => adminWorkspaceDetail(props.id))
  const data = () => result()?.data
  const error = () => result()?.error

  return (
    <Show when={result()} fallback={<AdminState title="Checking admin access" message="Loading the workspace backend." />}>
      <Show when={!error()} fallback={<AdminState title={adminErrorTitle(error(), "Workspace unavailable")} message={error() ?? ""} />}>
        <section data-slot="admin-section">
          <div data-slot="section-title">
            <h2>Workspace</h2>
            <p>{data()?.workspace.name}</p>
          </div>
          <div data-slot="facts">
            <div><span>ID</span><strong>{data()?.workspace.id}</strong></div>
            <div><span>Balance</span><strong>{formatMoney(data()?.billing?.balance)}</strong></div>
            <div><span>Monthly limit</span><strong>{data()?.billing?.monthlyLimit ?? "none"}</strong></div>
            <div><span>Reload</span><strong>{data()?.billing?.reload ? "enabled" : "disabled"}</strong></div>
          </div>
        </section>
        <WorkspaceOperations workspaceID={props.id} billing={data()?.billing} />
        <section data-slot="admin-section">
          <div data-slot="section-title">
            <h2>Users</h2>
            <p>Memberships include deleted rows.</p>
          </div>
          <div data-slot="table-shell">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Account</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Monthly</th>
                  <th>Operate</th>
                </tr>
              </thead>
              <tbody>
                <For each={data()?.users ?? []}>
                  {(row) => (
                    <tr>
                      <td>{row.user.id}</td>
                      <td>{row.user.accountID}</td>
                      <td>{row.phone ?? "-"}</td>
                      <td>{row.user.role}</td>
                      <td>{row.user.monthlyLimit ?? "none"}</td>
                      <td data-slot="inline-actions">
                        <form action={setUserMonthlyLimit} method="post">
                          <input type="hidden" name="workspaceID" value={props.id} />
                          <input type="hidden" name="userID" value={row.user.id} />
                          <input name="monthlyLimit" type="number" min="0" step="1" placeholder="limit" />
                          <ReasonInput />
                          <button>Set limit</button>
                        </form>
                        <form action={setUserDeleted} method="post">
                          <input type="hidden" name="workspaceID" value={props.id} />
                          <input type="hidden" name="userID" value={row.user.id} />
                          <input type="hidden" name="deleted" value={row.user.timeDeleted ? "false" : "true"} />
                          <ReasonInput />
                          <button>{row.user.timeDeleted ? "Restore" : "Delete"}</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </section>
        <ActivityTables data={data()} />
      </Show>
    </Show>
  )
}

function AccountDetail(props: { id: string }) {
  const result = createAsync(() => adminAccountDetail(props.id))
  const data = () => result()?.data
  const error = () => result()?.error

  return (
    <Show when={result()} fallback={<AdminState title="Checking admin access" message="Loading the account backend." />}>
      <Show when={!error()} fallback={<AdminState title={adminErrorTitle(error(), "Account unavailable")} message={error() ?? ""} />}>
        <section data-slot="admin-section">
          <div data-slot="section-title">
            <h2>Account</h2>
            <p>{props.id}</p>
          </div>
          <div data-slot="facts">
            <For each={data()?.auth ?? []}>
              {(auth) => <div><span>{auth.provider}</span><strong>{auth.subject}</strong></div>}
            </For>
          </div>
        </section>
        <section data-slot="admin-section">
          <div data-slot="section-title">
            <h2>Memberships</h2>
            <p>All workspaces for this account.</p>
          </div>
          <div data-slot="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Workspace</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <For each={data()?.memberships ?? []}>
                  {(row) => (
                    <tr>
                      <td>{row.workspace.name}<small>{row.workspace.id}</small></td>
                      <td>{row.user.id}</td>
                      <td>{row.user.role}</td>
                      <td>{formatMoney(row.billing?.balance)}</td>
                      <td>{row.user.timeDeleted || row.workspace.timeDeleted ? "deleted" : "active"}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </section>
        <ActivityTables data={data()} />
      </Show>
    </Show>
  )
}

function ActivityTables(props: { data?: { payments?: unknown[]; usage?: unknown[]; keys?: unknown[]; projects?: unknown[]; audits?: unknown[] } }) {
  const counts = [
    ["Payments", props.data?.payments?.length ?? 0],
    ["Usage", props.data?.usage?.length ?? 0],
    ["API keys", props.data?.keys?.length ?? 0],
    ["Projects", props.data?.projects?.length ?? 0],
    ["Audit", props.data?.audits?.length ?? 0],
  ]

  return (
    <section data-slot="admin-section">
      <div data-slot="section-title">
        <h2>Recent Activity</h2>
        <p>Counts reflect the latest rows loaded for this detail view.</p>
      </div>
      <div data-slot="facts">
        <For each={counts}>{(item) => <div><span>{item[0]}</span><strong>{item[1]}</strong></div>}</For>
      </div>
    </section>
  )
}

export default function AdminRoute() {
  const params = useParams()
  const id = () => (params.id === "index" ? undefined : params.id)

  return (
    <Show when={id()} keyed fallback={<AdminHome />}>
      {(target) => (
        <>
          <header data-slot="admin-header">
            <div>
              <p data-slot="eyebrow">Zingpop Admin</p>
              <h1>{target}</h1>
            </div>
          </header>
          <Show when={target.startsWith("wrk_")} fallback={<AccountDetail id={target} />}>
            <WorkspaceDetail id={target} />
          </Show>
        </>
      )}
    </Show>
  )
}
