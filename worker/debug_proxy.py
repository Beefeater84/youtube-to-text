"""Quick proxy debug — run from worker/ dir with .env loaded."""
import os
from dotenv import load_dotenv

load_dotenv()

proxy_url = os.environ.get("RESIDENTIAL_PROXY_URL")
print(f"Proxy URL: {proxy_url}")

import requests

proxies = {"http": proxy_url, "https": proxy_url}

# Test 1: same endpoint as curl test
print("\n--- Test 1: geo.brdtest.com via requests ---")
try:
    r = requests.get(
        "https://geo.brdtest.com/welcome.txt?product=resi&method=native",
        proxies=proxies,
        verify=False,
        timeout=15,
    )
    print(f"Status: {r.status_code}")
    print(r.text[:300])
except Exception as e:
    print(f"FAILED: {e}")

# Test 2: YouTube (same as yt-dlp will do)
print("\n--- Test 2: youtube.com via requests ---")
try:
    r = requests.get(
        "https://www.youtube.com/watch?v=UabBYexBD4k",
        proxies=proxies,
        verify=False,
        timeout=15,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    print(f"Status: {r.status_code}")
    print(r.text[:200])
except Exception as e:
    print(f"FAILED: {e}")
