#!/usr/bin/env python3
"""Controlled, single-object Supabase Storage -> Cloudflare R2 copy.

Only reviewed tournament media buckets are enabled in this pilot. The source
object is never modified or deleted. Destination paths follow the approved
PLATO LAND semantic layout rather than exposing Supabase bucket names.
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


def destination_for(source_bucket: str, source_key: str) -> str:
    """Map only approved tournament media keys to the documented R2 layout."""
    parts = source_key.split("/")
    if not source_key or any(part in ("", ".", "..") for part in parts):
        raise SystemExit("STOP: invalid or empty source object key.")

    if source_bucket == "series2-slides":
        series_root = "backgammon/series-2"
        if len(parts) < 2:
            raise SystemExit("STOP: Series 2 media key must include a media folder.")
        if parts[0] == "poster":
            media_root = "posters"
        elif parts[0] == "slides":
            media_root = "slides"
        else:
            raise SystemExit("STOP: unsupported Series 2 media folder.")
        remainder = "/".join(parts[1:])
    elif source_bucket == "series3-slides":
        series_root = "backgammon/series-3"
        if len(parts) < 2:
            raise SystemExit("STOP: Series 3 media key must include a media folder.")
        if parts[0] == "poster":
            media_root = "posters"
        elif parts[0] == "slides":
            media_root = "slides"
        else:
            raise SystemExit("STOP: unsupported Series 3 media folder.")
        remainder = "/".join(parts[1:])
    elif source_bucket == "series3-video":
        series_root = "backgammon/series-3"
        if len(parts) < 2 or parts[0] not in ("rules", "teaser"):
            raise SystemExit("STOP: unsupported Series 3 video folder.")
        media_root = f"videos/{parts[0]}"
        remainder = "/".join(parts[1:])
    else:
        raise SystemExit(
            "STOP: this pilot is limited to reviewed Series 2/3 tournament media buckets."
        )

    if not remainder or any(part in ("", ".", "..") for part in remainder.split("/")):
        raise SystemExit("STOP: invalid media object name.")
    return f"plato-land/{series_root}/{media_root}/{remainder}"


ALLOWED_BUCKETS = {"series2-slides", "series3-slides", "series3-video"}
if SOURCE_BUCKET not in ALLOWED_BUCKETS:
    raise SystemExit("STOP: source bucket is not enabled for this reviewed pilot.")
if not R2_ENDPOINT.startswith("https://"):
    raise SystemExit("STOP: R2_ENDPOINT must be an HTTPS S3 endpoint.")

destination_key = destination_for(SOURCE_BUCKET, SOURCE_KEY)
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
    Metadata={
        "source-bucket": SOURCE_BUCKET,
        "source-key-sha256": hashlib.sha256(SOURCE_KEY.encode()).hexdigest(),
        "sha256": sha256,
    },
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
