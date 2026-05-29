# Local Folder Sync Projects Design

## Goal

Zingpop Web must let non-technical users open an arbitrary local folder through the native browser folder picker, work on it in the cloud workbench, and sync cloud-side file changes back to the selected local folder.

The user experience should not ask users to type paths such as `D:\...` or `/srv/...`.

## Product Scope

Phase 1 supports three project entry points:

- Open local folder
- Import public Git repository
- Create empty project

Open local folder means:

1. The browser opens the native folder picker with `showDirectoryPicker()`.
2. The user grants read/write access to a local folder.
3. The browser uploads a filtered snapshot of that folder to a Zingpop-owned cloud project directory.
4. The workbench opens the cloud project directory.
5. When cloud files change, the browser can write changed files back to the selected local folder.

Phase 1 does not support:

- Private Git credentials, deploy keys, or token storage.
- Browser support outside File System Access API capable browsers such as Chrome and Edge.
- Silent disk access without user permission.
- Full real-time bidirectional filesystem sync.
- Running terminals or model tools directly on the user's machine.

## Architecture

Add a Zingpop-owned project layer around opencode.

`workbench_project` records belong to a Zingpop workspace and map to server-generated directories:

`/srv/zingpop/workspaces/<workspace_id>/projects/<project_id>/`

The opencode runtime continues to operate on normal directories, but those directories must come from Zingpop project records. The public app must not expose arbitrary path entry or opencode experimental workspace APIs as product project management.

The browser stores local folder handles and file hash state in IndexedDB. These handles are origin-bound and require browser/user permission.

## Data Model

Add `workbench_project` in console core:

- `workspace_id`: owning Zingpop workspace.
- `id`: server-generated project ID.
- `name`: display name.
- `source_type`: `local_folder`, `git_public`, or `empty`.
- `source_label`: local folder name or Git URL label for display only.
- `directory`: server-generated absolute cloud directory.
- `sync_mode`: `manual` or `auto`.
- `time_created`, `time_updated`, `time_deleted`.

The table must have a composite primary key or unique index on `(workspace_id, id)` and a unique index on `(workspace_id, directory)`.

Local folder handles are not stored on the server.

## Server API

Expose same-origin Zingpop APIs on `app.zingpop.cn` under `/_zingpop/project`.

Required endpoints:

- `GET /_zingpop/project`: list projects for the authenticated workspace.
- `POST /_zingpop/project/empty`: create an empty cloud project.
- `POST /_zingpop/project/git`: create a project from a public HTTPS Git repository.
- `POST /_zingpop/project/local`: create a project record for a local folder upload.
- `POST /_zingpop/project/:projectID/files`: upload one batch of files.
- `GET /_zingpop/project/:projectID/manifest`: return recursive cloud file metadata and hashes.
- `GET /_zingpop/project/:projectID/file?path=<relative>`: download one cloud file.
- `PATCH /_zingpop/project/:projectID`: rename project.
- `DELETE /_zingpop/project/:projectID`: soft-delete the project record.

All endpoints must:

- Resolve the authenticated account from the product session.
- Resolve the account's workspace.
- Verify `projectID` belongs to that workspace.
- Reject absolute paths, `..`, NUL bytes, and unsafe path separators in uploaded or downloaded relative paths.
- Enforce upload limits.

## Upload Rules

The browser uploads files recursively from the selected local folder, excluding:

- `.git/`
- `node_modules/`
- `dist/`
- `build/`
- `.next/`
- `.turbo/`
- `.cache/`
- `.env`
- `.env.*`
- binary files above the configured size limit

Phase 1 default limits:

- Max 2,000 files.
- Max 200 MB total upload.
- Max 10 MB per file.

If limits are exceeded, show a clear error and leave the project un-opened until the user chooses a smaller folder or removes excluded files.

## Local Sync Back

The browser keeps a local sync baseline in IndexedDB:

- Local file path.
- Last local hash.
- Last cloud hash.
- Last sync timestamp.

When syncing cloud changes back to local:

1. Fetch cloud manifest.
2. Compare cloud hashes with the last known cloud hashes.
3. For each changed cloud file, re-read the local file if it still exists.
4. If local hash still matches the last local hash, overwrite local with cloud content.
5. If local hash changed independently, mark a conflict and do not overwrite automatically.

Conflict handling in Phase 1:

- Show a conflict list in the project sync UI.
- Let users choose per file: keep local, overwrite local with cloud, or save cloud copy as `<filename>.zingpop-conflict`.

Deleted files are not automatically deleted locally in Phase 1. Show them as pending deletes with manual confirmation.

## UI

Replace the current remote web "Open project" directory search dialog with a Zingpop project dialog when connected to `app.zingpop.cn`.

The dialog has three actions:

- Open local folder
- Import Git repository
- Create empty project

The local folder flow shows:

- Native folder picker.
- Upload progress.
- Skipped file count.
- Conflict or error state.
- Open project button after upload completes.

Project sidebar display should show project names, not server paths. A secondary tooltip can show source labels such as the local folder name or Git repo name, but should not expose `/srv/...` as the primary UI.

For unsupported browsers, show:

`Your browser cannot open local folders. Use Chrome or Edge, or import a public Git repository.`

## Auth And Routing

`/auth/status` should resolve the target project from the original request:

- If the original request has a `directory` query, it may only resolve if that directory belongs to an active `workbench_project` for the authenticated workspace.
- If no project is specified, resolve the workspace's default project.
- Return `X-Opencode-Directory`, `X-Opencode-Workspace`, `X-Zingpop-Workspace-ID`, and `X-Zingpop-Project-ID` from the resolved project.

Client-supplied directories are never passed through as trusted values. They are identifiers to match against server-owned project records only.

## Nginx

Add `/_zingpop/` routes on `app.zingpop.cn` that proxy to the console app with product auth.

Block public access to opencode experimental workspace routes:

- `/experimental/workspace`
- `/experimental/workspace/*`

The generic opencode proxy remains responsible for workbench API traffic, but only after auth has converted the request to a server-owned project directory.

## Git Import

Phase 1 Git import supports public HTTPS repositories only.

Validation:

- URL protocol must be `https:`.
- Host must be in an allowlist.
- No username or password in URL.
- Branch is optional and must be a safe branch name.
- Clone must run with timeout and size controls.

Git import writes only into the generated project directory.

## Testing

Required automated coverage:

- Project directory generation rejects path traversal.
- Account A cannot list, open, upload to, download from, or sync Account B's project.
- Auth status resolves only projects that belong to the authenticated workspace.
- Nginx blocks opencode experimental workspace routes.
- Local sync hashing detects cloud-only changes.
- Local sync detects local/cloud conflicts and does not overwrite local changes.
- Upload filtering excludes `.git`, `node_modules`, `.env`, and oversized files.
- Git import rejects non-HTTPS URLs and URLs with credentials.

Browser QA:

- Chrome/Edge can select an arbitrary local folder.
- Upload progress completes on a small project.
- Cloud-edited file syncs back to local after permission grant.
- Conflict state appears when local and cloud both change.
- Unsupported browser message appears when `showDirectoryPicker` is missing.

## Rollout

Ship behind a feature flag:

`ZINGPOP_LOCAL_FOLDER_SYNC=1`

When disabled:

- Keep Git import and empty project available.
- Hide local folder sync UI.

Production rollout order:

1. Add schema and backend APIs.
2. Add Nginx `/_zingpop/` and experimental workspace blocks.
3. Add frontend project dialog and local folder sync client.
4. Run local package checks.
5. Deploy to server.
6. Run authenticated two-account isolation probe in production.
7. Enable feature flag for pilot users.

