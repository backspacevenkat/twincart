#!/bin/bash
# Minimal Amplify deploy using the already-built out/. Status → ./.deploy_result (project dir, not /tmp).
cd /Users/venkat/Documents/twincart
set -a; . ./.env; set +a
R=us-east-1; F=./.deploy_result; : > "$F"
test -f out/index.html || { echo "result=NO_BUILD" >> "$F"; exit 1; }

APPID=$(aws amplify list-apps --region $R --query "apps[?name=='twincart'].appId | [0]" --output text 2>>"$F")
if [ "$APPID" = "None" ] || [ -z "$APPID" ]; then
  APPID=$(aws amplify create-app --name twincart --platform WEB --region $R --query app.appId --output text 2>>"$F")
fi
echo "appId=$APPID" >> "$F"
aws amplify create-branch --app-id "$APPID" --branch-name main --region $R >/dev/null 2>&1 || true

( cd out && rm -f ../.tc_out.zip && zip -qr ../.tc_out.zip . )
DEP=$(aws amplify create-deployment --app-id "$APPID" --branch-name main --region $R --output json 2>>"$F")
JOB=$(printf '%s' "$DEP" | python3 -c 'import sys,json;print(json.load(sys.stdin)["jobId"])' 2>>"$F")
URLUP=$(printf '%s' "$DEP" | python3 -c 'import sys,json;print(json.load(sys.stdin)["zipUploadUrl"])' 2>>"$F")
echo "jobId=$JOB" >> "$F"
curl -s -H "Content-Type: application/zip" --upload-file ./.tc_out.zip "$URLUP" -o /dev/null -w 'upload=%{http_code}\n' >> "$F"
aws amplify start-deployment --app-id "$APPID" --branch-name main --job-id "$JOB" --region $R >/dev/null 2>>"$F"

for i in $(seq 1 60); do
  S=$(aws amplify get-job --app-id "$APPID" --branch-name main --job-id "$JOB" --region $R --query job.summary.status --output text 2>/dev/null)
  [ "$S" = "SUCCEED" ] && { echo "status=SUCCEED" >> "$F"; break; }
  [ "$S" = "FAILED" ] && { echo "status=FAILED" >> "$F"; break; }
  [ "$S" = "CANCELLED" ] && { echo "status=CANCELLED" >> "$F"; break; }
  sleep 8
done
URL="https://main.${APPID}.amplifyapp.com"
echo "url=$URL" >> "$F"
echo "http=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/" 2>/dev/null)" >> "$F"
rm -f ./.tc_out.zip
echo "result=DONE" >> "$F"
