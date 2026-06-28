#!/usr/bin/env bash
#
# Ping IndexNow so participating engines (Bing, Yandex, Naver, Seznam — Bing
# also powers ChatGPT Search and Copilot answers) re-crawl the site fast.
# Google ignores IndexNow, so it still relies on the sitemap + Search Console.
#
# Run once after each production deploy:  bun run indexnow
#
set -euo pipefail

HOST="rateaprompt.dibenko.com"
KEY="495baeee1041b654a3f4eaf9a8dd2819"

# URLs to (re)crawl. Add new routes here as the site grows.
URLS=(
  "https://${HOST}/"
)

url_json=$(printf '"%s",' "${URLS[@]}" | sed 's/,$//')
payload="{\"host\":\"${HOST}\",\"key\":\"${KEY}\",\"keyLocation\":\"https://${HOST}/${KEY}.txt\",\"urlList\":[${url_json}]}"

echo "Submitting ${#URLS[@]} URL(s) to IndexNow…"
curl -fsS -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "${payload}" -w $'\nHTTP %{http_code}\n'
echo "Done. (HTTP 200/202 = accepted.)"
