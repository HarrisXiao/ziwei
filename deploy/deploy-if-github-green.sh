#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ziwei}"
BRANCH="${BRANCH:-main}"
REPO_SLUG="${REPO_SLUG:-HarrisXiao/ziwei}"
DEPLOY_SCRIPT="${DEPLOY_SCRIPT:-$APP_DIR/deploy/deploy-backend.sh}"

cd "$APP_DIR"
git fetch origin "$BRANCH:refs/remotes/origin/$BRANCH" >/dev/null

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  echo "Already deployed: $LOCAL_SHA"
  exit 0
fi

RUNS_JSON="$(curl -fsS "https://api.github.com/repos/$REPO_SLUG/actions/runs?branch=$BRANCH&event=push&per_page=10")"
RUN_STATE="$(printf '%s' "$RUNS_JSON" | node -e '
let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const target = process.argv[1];
  const runs = JSON.parse(input).workflow_runs || [];
  const run = runs.find((item) => item.head_sha === target);
  if (!run) {
    console.log("missing");
    return;
  }
  console.log(`${run.status}:${run.conclusion || ""}`);
});
' "$REMOTE_SHA")"

case "$RUN_STATE" in
  completed:success)
    echo "GitHub Actions passed for $REMOTE_SHA; deploying."
    exec bash "$DEPLOY_SCRIPT"
    ;;
  missing)
    echo "No GitHub Actions run found yet for $REMOTE_SHA; waiting."
    ;;
  *)
    echo "GitHub Actions is not green for $REMOTE_SHA: $RUN_STATE"
    ;;
esac
