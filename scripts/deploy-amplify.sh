#!/bin/bash
# TwinCart → AWS Amplify static deploy. Writes status to /tmp/amplify_status.txt
set -e
cd /Users/venkat/Documents/twincart
set -a; . ./.env; set +a
REGION=us-east-1
OUT=/tmp/amplify_status.txt
: > "$OUT"

echo "step=build" >> "$OUT"
rm -rf out .next
./node_modules/.bin/next build >/tmp/amplify_build.log 2>&1 || { echo "BUILD_FAILED" >> "$OUT"; tail -15 /tmp/amplify_build.log >> "$OUT"; exit 1; }
test -f out/index.html || { echo "NO_OUT" >> "$OUT"; exit 1; }
echo "build_ok bytes=$(wc -c < out/index.html)" >> "$OUT"

# reuse or create app
APPID=$(aws amplify list-apps --region $REGION --query "apps[?name=='twincart'].appId | [0]" --output text 2>/dev/null)
if [ "$APPID" = "None" ] || [ -z "$APPID" ]; then
  APPID=$(aws amplify create-app --name twincart --platform WEB --region $REGION --query app.appId --output text)
  echo "created_app=$APPID" >> "$OUT"
else
  echo "reused_app=$APPID" >> "$OUT"
fi
aws amplify create-branch --app-id "$APPID" --branch-name main --region $REGION >/dev/null 2>&1 || true

# zip and deploy
( cd out && rm -f /tmp/tc_out.zip && zip -qr /tmp/tc_out.zip . )
echo "zip_bytes=$(wc -c < /tmp/tc_out.zip)" >> "$OUT"
DEP=$(aws amplify create-deployment --app-id "$APPID" --branch-name main --region $REGION --output json)
JOBID=$(echo "$DEP" | python3 -c 'import sys,json;print(json.load(sys.stdin)["jobId"])')
UPURL=$(echo "$DEP" | python3 -c 'import sys,json;print(json.load(sys.stdin)["zipUploadUrl"])')
echo "jobId=$JOBID" >> "$OUT"
curl -s -H "Content-Type: application/zip" --upload-file /tmp/tc_out.zip "$UPURL" -o /dev/null -w "upload_http=%{http_code}\n" >> "$OUT"
aws amplify start-deployment --app-id "$APPID" --branch-name main --job-id "$JOBID" --region $REGION >/dev/null

for i in $(seq 1 50); do
  ST=$(aws amplify get-job --app-id "$APPID" --branch-name main --job-id "$JOBID" --region $REGION --query job.summary.status --output text 2>/dev/null)
  echo "poll_$i=$ST" >> "$OUT"
  { [ "$ST" = "SUCCEED" ] || [ "$ST" = "FAILED" ] || [ "$ST" = "CANCELLED" ]; } && break
  sleep 8
done

URL="https://main.${APPID}.amplifyapp.com"
echo "DEPLOY_URL=$URL" >> "$OUT"
CODE=$(curl -s -o /tmp/amplify_live.html -w '%{http_code}' --max-time 20 "$URL/" || echo 000)
echo "live_http=$CODE" >> "$OUT"
echo "markers=$(grep -c -E 'Find the twin|TwinCart' /tmp/amplify_live.html 2>/dev/null || echo 0)" >> "$OUT"
echo "DONE" >> "$OUT"
