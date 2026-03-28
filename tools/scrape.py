#!/usr/bin/env python3
"""
Unstop Hackathons Scraper — via Cloudflare Browser Rendering API
Target: https://unstop.com/hackathons?oppstatus=open&usertype=students&domain=2

Strategy:
  Step 1 — /content  : fetch page 1's rendered HTML, auto-detect card selectors
                        (run once to inspect the DOM if selectors need tuning)
  Step 2 — /scrape   : use CSS selectors to extract structured card data per page
  Step 3 — paginate  : loop &page=N until no more cards found

Docs: https://developers.cloudflare.com/browser-rendering/rest-api/
"""

import os
import re
import json
import time
import csv
import requests
from datetime import datetime
from html.parser import HTMLParser

# ── Cloudflare credentials ────────────────────────────────────────────────────
# Set these as env vars, or hardcode for quick testing:
#   export CF_ACCOUNT_ID="your_account_id"
#   export CF_API_TOKEN="your_api_token"

CF_ACCOUNT_ID = 'my account id'
CF_API_TOKEN  = 'my api token'

CF_BASE = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/browser-rendering"

CF_HEADERS = {
    "Authorization": f"Bearer {CF_API_TOKEN}",
    "Content-Type" : "application/json",
}

# ── Target ────────────────────────────────────────────────────────────────────

BASE_URL = "https://unstop.com"
FILTERS  = "oppstatus=open&usertype=students&domain=2"
DELAY    = 2.0   # seconds between pages (be polite)

def page_url(page: int) -> str:
    return f"{BASE_URL}/hackathons?{FILTERS}&page={page}"

# ── Shared browser options ────────────────────────────────────────────────────

GOTO_OPTIONS = {
    "waitUntil": "networkidle2",   # wait for JS to finish rendering
    "timeout"  : 30_000,           # 30 s
}

# Block resources we don't need — speeds up render, saves browser seconds
REJECT_RESOURCE_TYPES = ["image", "media", "font", "stylesheet"]


# ── STEP 1: /content — inspect raw rendered HTML ─────────────────────────────
#
# Run this once to understand the DOM structure and tune CSS selectors below.
# Saves the full HTML to unstop_page1.html for inspection.

def fetch_content(page: int = 1) -> str:
    """Fetch fully-rendered HTML via Cloudflare /content endpoint."""
    payload = {
        "url"                : page_url(page),
        "gotoOptions"        : GOTO_OPTIONS,
        "rejectResourceTypes": REJECT_RESOURCE_TYPES,
    }
    r = requests.post(f"{CF_BASE}/content", headers=CF_HEADERS, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()
    if not data.get("success"):
        raise RuntimeError(f"/content failed: {data}")
    return data["result"]   # raw HTML string


def inspect_dom(save_path: str = "unstop_page1.html"):
    """Save rendered HTML so you can inspect selectors in a browser / DevTools."""
    print("Fetching rendered HTML for DOM inspection...")
    html = fetch_content(page=1)
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Saved → {save_path}")
    print("Open this file in your browser and use DevTools to find the right CSS selectors.")


# ── STEP 2: /scrape — extract structured data with CSS selectors ──────────────
#
# These selectors are based on common Next.js / Unstop card patterns.
# If /scrape returns empty results, run inspect_dom() first to tune them.
#
# Selector strategy:
#   - One broad selector captures all card containers
#   - Inner selectors pick out title, org, deadline, prize, etc.

CARD_SELECTORS = [
    # Card container — adjust this if cards use a different class
    {"selector": "[class*='opportunity-card'], [class*='card_content'], [class*='listing-card']"},
    # Title
    {"selector": "[class*='opportunity-card'] [class*='title'], [class*='card_content'] h2, [class*='card_content'] h3"},
    # Organisation / host
    {"selector": "[class*='opportunity-card'] [class*='org'], [class*='opportunity-card'] [class*='company'], [class*='host']"},
    # Deadline / registration end
    {"selector": "[class*='opportunity-card'] [class*='deadline'], [class*='opportunity-card'] [class*='date'], [class*='reg_end']"},
    # Prize pool
    {"selector": "[class*='opportunity-card'] [class*='prize'], [class*='opportunity-card'] [class*='reward']"},
    # Participants count
    {"selector": "[class*='opportunity-card'] [class*='registered'], [class*='opportunity-card'] [class*='participant']"},
    # Direct links (href to /p/slug)
    {"selector": "a[href*='/p/'], a[href*='/hackathons/']"},
]

def fetch_scrape(page: int) -> dict:
    """Call Cloudflare /scrape and return the raw results dict."""
    payload = {
        "url"                : page_url(page),
        "elements"           : CARD_SELECTORS,
        "gotoOptions"        : GOTO_OPTIONS,
        "rejectResourceTypes": REJECT_RESOURCE_TYPES,
    }
    r = requests.post(f"{CF_BASE}/scrape", headers=CF_HEADERS, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()
    if not data.get("success"):
        raise RuntimeError(f"/scrape failed: {data}")
    return data["result"]   # list of { selector, results: [...] }


# ── Parse /scrape response into hackathon dicts ───────────────────────────────

def extract_links(scrape_result: list) -> dict[str, str]:
    """Build a map of {slug → full_url} from anchor tags."""
    links = {}
    for block in scrape_result:
        if "/p/" in block.get("selector", "") or "/hackathons/" in block.get("selector", ""):
            for el in block.get("results", []):
                for attr in el.get("attributes", []):
                    if attr["name"] == "href":
                        href  = attr["value"]
                        slug  = href.rstrip("/").split("/")[-1]
                        links[slug] = href if href.startswith("http") else BASE_URL + href
    return links

def parse_scrape_response(scrape_result: list) -> list[dict]:
    """
    Convert raw /scrape output into normalised hackathon dicts.

    /scrape returns one entry per selector. We correlate elements by
    their vertical position (top) — elements closest in Y-position
    belong to the same card.
    """
    # Collect card containers first
    cards_raw = []
    for block in scrape_result:
        sel = block.get("selector", "")
        if "opportunity-card" in sel or "card_content" in sel or "listing-card" in sel:
            cards_raw = block.get("results", [])
            break

    if not cards_raw:
        # Fallback: use links as the card list
        cards_raw = []
        for block in scrape_result:
            if "/p/" in block.get("selector", ""):
                cards_raw = block.get("results", [])
                break

    # Build lookup: selector_type → list of (top, text, attributes)
    def bucket(keyword: str) -> list[tuple]:
        for block in scrape_result:
            if keyword in block.get("selector", ""):
                return [(el.get("top", 0), el.get("text", "").strip(), el.get("attributes", []))
                        for el in block.get("results", [])]
        return []

    titles    = bucket("title")
    orgs      = bucket("org") or bucket("company") or bucket("host")
    deadlines = bucket("deadline") or bucket("date") or bucket("reg_end")
    prizes    = bucket("prize") or bucket("reward")
    parts     = bucket("registered") or bucket("participant")
    link_els  = []
    for block in scrape_result:
        if "/p/" in block.get("selector", "") or "/hackathons/" in block.get("selector", ""):
            link_els = [(el.get("top", 0), el.get("text", "").strip(), el.get("attributes", []))
                        for el in block.get("results", [])]
            break

    def nearest(pool: list[tuple], ref_top: float) -> str:
        """Return the text of the element whose top is closest to ref_top."""
        if not pool:
            return ""
        return min(pool, key=lambda x: abs(x[0] - ref_top))[1]

    def nearest_href(pool: list[tuple], ref_top: float) -> str:
        if not pool:
            return ""
        closest = min(pool, key=lambda x: abs(x[0] - ref_top))
        for attr in closest[2]:
            if attr["name"] == "href":
                href = attr["value"]
                return href if href.startswith("http") else BASE_URL + href
        return ""

    hackathons = []
    for card in cards_raw:
        top  = card.get("top", 0)
        text = card.get("text", "").strip()

        # If card is a link itself
        url = ""
        for attr in card.get("attributes", []):
            if attr["name"] == "href":
                url = attr["value"]
                if not url.startswith("http"):
                    url = BASE_URL + url

        hackathons.append({
            "title"       : nearest(titles, top)    or text[:80],
            "organisation": nearest(orgs, top),
            "deadline"    : nearest(deadlines, top),
            "prize"       : nearest(prizes, top),
            "participants": nearest(parts, top),
            "url"         : url or nearest_href(link_els, top),
            "scraped_at"  : datetime.utcnow().isoformat(),
        })

    return hackathons


# ── STEP 3: paginate ──────────────────────────────────────────────────────────

def scrape_all(max_pages: int = 1) -> list[dict]:
    all_items = []

    for page in range(1, max_pages + 1):
        print(f"\n[Page {page}]  →  {page_url(page)}")
        try:
            result = fetch_scrape(page)
        except Exception as e:
            print(f"  ✗ Error: {e}")
            break

        items = parse_scrape_response(result)

        if not items:
            print(f"  ✗ No cards found — end of listings.")
            break

        # Deduplicate against what we already have (by URL)
        seen_urls = {h["url"] for h in all_items}
        new_items = [h for h in items if h["url"] not in seen_urls]

        if not new_items:
            print(f"  ✗ Duplicate page — stopping.")
            break

        all_items.extend(new_items)
        print(f"  ✓ {len(new_items)} new listings  |  total: {len(all_items)}")
        time.sleep(DELAY)

    print(f"\n✅  {len(all_items)} hackathons scraped.")
    return all_items


# ── Save ───────────────────────────────────────────────────────────────────────

def save(items: list[dict]):
    if not items:
        print("Nothing to save.")
        return

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    jpath = f"hackathons_{ts}.json"
    with open(jpath, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    print(f"💾  JSON → {jpath}")

    cpath = f"hackathons_{ts}.csv"
    with open(cpath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=items[0].keys())
        writer.writeheader()
        writer.writerows(items)
    print(f"💾  CSV  → {cpath}")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    # Usage:
    #   python unstop_cf_scraper.py             → scrape all pages
    #   python unstop_cf_scraper.py inspect     → dump page 1 HTML for selector debugging
    #   python unstop_cf_scraper.py scrape 3    → scrape first 3 pages only

    mode = sys.argv[1] if len(sys.argv) > 1 else "scrape"

    if mode == "inspect":
        # Save rendered HTML so you can open it in a browser and find the right
        # CSS selectors using DevTools → Inspect Element
        inspect_dom("unstop_page1.html")
        print("\nNext: open unstop_page1.html in Chrome, right-click a card")
        print("→ Inspect → copy the class names → update CARD_SELECTORS above.")

    elif mode == "scrape":
        max_p = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        print(f"🔍  Scraping Unstop hackathons (up to {max_p} pages)...\n")
        results = scrape_all(max_pages=max_p)
        if results:
            save(results)
            print("\n── Preview ──────────────────────────────────────────────────────")
            for h in results[:5]:
                print(f"  • {h['title']}")
                print(f"    org={h['organisation']}  deadline={h['deadline']}  prize={h['prize']}")
                print(f"    {h['url']}")
        else:
            print("\n⚠️  No results.")
            print("Run with 'inspect' first to check rendered HTML and tune selectors:")
            print("  python unstop_cf_scraper.py inspect")