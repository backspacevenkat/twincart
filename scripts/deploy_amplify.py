#!/usr/bin/env python3
"""Self-contained Amplify static deploy via boto3 — avoids bash/pipe corruption.
Reads creds from .env, deploys out/ as a zip, writes final status to ./.deploy_status."""
import os, time, zipfile, io, urllib.request, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
os.chdir(ROOT)
# load .env
for line in (ROOT / ".env").read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ.setdefault(k, v)

import boto3
status = {}
def finish(**kw):
    status.update(kw)
    (ROOT / ".deploy_status").write_text(json.dumps(status, indent=1))

region = os.environ.get("AWS_REGION", "us-east-1")
amp = boto3.client("amplify", region_name=region)

# find or create app
apps = amp.list_apps()["apps"]
app = next((a for a in apps if a["name"] == "twincart"), None)
app_id = app["appId"] if app else amp.create_app(name="twincart", platform="WEB")["app"]["appId"]
finish(appId=app_id)

# ensure branch
try:
    amp.get_branch(appId=app_id, branchName="main")
except amp.exceptions.NotFoundException:
    amp.create_branch(appId=app_id, branchName="main")

# zip out/ in memory
out = ROOT / "out"
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
    for p in out.rglob("*"):
        if p.is_file():
            z.write(p, p.relative_to(out).as_posix())
data = buf.getvalue()
finish(appId=app_id, zip_bytes=len(data))

# create deployment → upload zip → start
dep = amp.create_deployment(appId=app_id, branchName="main")
job_id, up_url = dep["jobId"], dep["zipUploadUrl"]
req = urllib.request.Request(up_url, data=data, method="PUT",
                             headers={"Content-Type": "application/zip"})
with urllib.request.urlopen(req) as r:
    up_code = r.status
finish(appId=app_id, zip_bytes=len(data), jobId=job_id, upload=up_code)

amp.start_deployment(appId=app_id, branchName="main", jobId=job_id)

# poll
final = "?"
for _ in range(60):
    s = amp.get_job(appId=app_id, branchName="main", jobId=job_id)["job"]["summary"]["status"]
    final = s
    if s in ("SUCCEED", "FAILED", "CANCELLED"):
        break
    time.sleep(8)

url = f"https://main.{app_id}.amplifyapp.com"
http = "?"
try:
    with urllib.request.urlopen(url, timeout=20) as r:
        body = r.read(4000).decode("utf-8", "ignore")
        http = r.status
        markers = body.count("TwinCart") + body.count("Find the twin")
except Exception as e:
    markers = 0
    http = f"err:{e}"
finish(appId=app_id, zip_bytes=len(data), jobId=job_id, upload=up_code,
       deploy_status=final, url=url, http=http, markers=markers)
print("done", final, url)
