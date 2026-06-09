#!/usr/bin/env bash
set -euo pipefail

COMMIT="${1:-${ZINGPOP_DEPLOY_COMMIT:-}}"
REPO="${ZINGPOP_DEPLOY_REPO:-/root/zingpop}"
GITHUB_REPO="${ZINGPOP_GITHUB_REPO:-lisir202446/zingpop}"
BRANCH="${ZINGPOP_DEPLOY_BRANCH:-main}"
BASE_URL="${ZINGPOP_DEPLOY_BASE_URL:-https://app.zingpop.cn}"

if [[ -z "$COMMIT" ]]; then
  echo "Usage: $0 <commit-sha>" >&2
  exit 1
fi

if [[ "$(id -u)" != "0" ]]; then
  echo "Run as root on the production server." >&2
  exit 1
fi

backup_dir="/root/zingpop-server-before-deploy-$(date +%Y%m%d-%H%M%S)"
workdir="$REPO"

if [[ -d "$REPO/.git" ]]; then
  mkdir -p "$backup_dir"
  (
    cd "$REPO"
    git status --short --branch > "$backup_dir/status.txt" || true
    git diff > "$backup_dir/dirty.patch" || true
    git remote set-url origin "https://github.com/$GITHUB_REPO.git" || true
  )
  echo "backup saved to $backup_dir"
fi

if [[ -d "$REPO/.git" ]]; then
  echo "== fetch GitHub $BRANCH =="
  if timeout 180 git -C "$REPO" -c http.version=HTTP/1.1 -c http.lowSpeedLimit=1 -c http.lowSpeedTime=60 fetch --no-tags --prune --depth=1 origin "$BRANCH" &&
    git -C "$REPO" cat-file -e "$COMMIT^{commit}" 2>/dev/null; then
    git -C "$REPO" checkout -B "$BRANCH" FETCH_HEAD
    git -C "$REPO" reset --hard "$COMMIT"
  else
    workdir=""
  fi
else
  workdir=""
fi

if [[ -z "$workdir" ]]; then
  echo "== Git fetch unavailable; using GitHub codeload tarball =="
  workdir="/root/zingpop-release-$COMMIT"
  archive="/tmp/zingpop-$COMMIT.tar.gz"
  rm -rf "$workdir"
  mkdir -p "$workdir"
  curl -fL --connect-timeout 20 --retry 5 --retry-delay 5 \
    "https://codeload.github.com/$GITHUB_REPO/tar.gz/$COMMIT" \
    -o "$archive"
  tar -xzf "$archive" -C "$workdir" --strip-components=1
fi

cd "$workdir"
chmod +x scripts/production-build.sh scripts/install-systemd.sh scripts/production-bun-install.sh

echo "== verify release source =="
bun scripts/verify-zingpop-opencode-config.mjs

echo "== build =="
export ZINGPOP_BUILD_COMMIT="$COMMIT"
if [[ "${ZINGPOP_FAST_BUILD:-1}" == "1" && "$workdir" == "$REPO" ]]; then
  if ! ZINGPOP_SKIP_BUN_INSTALL=1 ./scripts/production-build.sh; then
    echo "skip-install build failed; retrying full production build"
    ./scripts/production-build.sh
  fi
else
  ./scripts/production-build.sh
fi

echo "== install/restart =="
./scripts/install-systemd.sh
systemctl enable --now zingpop-opencode zingpop-console zingpop-backup.timer zingpop-health-check.timer
systemctl restart zingpop-opencode zingpop-console
nginx -t
systemctl reload nginx

echo "== production UX probe =="
bun scripts/production-ux-probe.mjs --dist /opt/zingpop/app/dist --base-url "$BASE_URL" --expected-commit "$COMMIT"

echo "DEPLOY_DONE $COMMIT"
