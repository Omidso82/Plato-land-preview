#!/usr/bin/env python3
"""Controlled, single-object Supabase Storage -> Cloudflare R2 copy.
Never deletes or modifies the source. Intended for Phase C pilot only.
"""
import hashlib
import os
import sys
from urllib.parse import quote

import boto3
import requests
from botocore.config import Config

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
R2_ENDPOINT = os.environ["R2_ENDPOINT"].rstrip("/")
R2_ACCESS_KEY_ID = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET_ACCESS_KEY = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET = os.environ.get("R2_BUCKET", "plato-land-media")
SOURCE_BUCKET = os.environ["SOURCE_BUCKET"].strip()
SOURCE_KEY = os.environ["SOURCE_KEY"].lstrip("/")
DRY_RUN = os.environ.get("DRY_RUN", "true").lower() == "true"

ALLOWED_BUCKETS = {
    "avatars", "plato-id-scans", "public-profile-avatars",
    "registration-evidence", "series2-slides", "series3-slides",
    "series3-video", "site-announcements",
}
if SOURCE_BUCKET not in ALLOWED_BUCKETS:
    raise SystemExit("STOP: source bucket is not in the reviewed inventory.")
if not SOURCE_KEY or ".." in SOURCE_KEY.split("/"):
    raise SystemExit("STOP: invalid or empty source object key.")
if not R2_ENDPOINT.startswith("https://"):
    raise SystemExit("STOP: R2_ENDPOINT must be an HTTPS S3 endpoint.")

source_url = (
    f"{SUPABASE_URL}/storage/v1/object/authenticated/"
    f"{quote(SOURCE_BUCKET, safe='')}/{quote(SOURCE_KEY, safe='/')}"
)
headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
response = requests.get(source_url, headers=headers, timeout=90)
if response.status_code != 200:
    raise SystemExit(f"STOP: Supabase source download failed (HTTP {response.status_code}).")
body = response.content
if not body:
    raise SystemExit("STOP: source object is empty; no copy attempted.")

sha256 = hashlib.sha256(body).hexdigest()
content_type = response.headers.get("content-type", "application/octet-stream").split(";")[0]
destination_key = f"plato-land/{SOURCE_BUCKET}/{SOURCE_KEY}"

print(f"Source: {SOURCE_BUCKET}/{SOURCE_KEY}")
print(f"Destination: {R2_BUCKET}/{destination_key}")
print(f"Bytes: {len(body)}")
print(f"Content-Type: {content_type}")
print(f"SHA-256: {sha256}")
print("Source deletion: DISABLED")

if DRY_RUN:
    print("DRY RUN: source was read and hashed; R2 was not modified.")
    sys.exit(0)

s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
)
s3.put_object(
    Bucket=R2_BUCKET,
    Key=destination_key,
    Body=body,
    ContentLength=len(body),
    ContentType=content_type,
    Metadata={"source-bucket": SOURCE_BUCKET, "source-key-sha256": hashlib.sha256(SOURCE_KEY.encode()).hexdigest(), "sha256": sha256},
)
head = s3.head_object(Bucket=R2_BUCKET, Key=destination_key)
if head.get("ContentLength") != len(body):
    raise SystemExit("FAIL: destination size does not match source; source remains untouched.")
stored = s3.get_object(Bucket=R2_BUCKET, Key=destination_key)["Body"].read()
stored_sha256 = hashlib.sha256(stored).hexdigest()
if stored_sha256 != sha256:
    raise SystemExit("FAIL: destination SHA-256 does not match source; source remains untouched.")
print(f"PASS: R2 object verified by size and SHA-256 ({stored_sha256}).")
print("Source object was NOT deleted or changed.")
