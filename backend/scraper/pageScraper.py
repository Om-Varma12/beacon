import httpx
import re

BASE_URL = "https://unstop.com/api/public/opportunity/search-result"

def clean_html(raw_html):
    return re.sub('<.*?>', '', raw_html or "")

async def scrape_pages(max_pages=50):
    async with httpx.AsyncClient() as client:
        for page in range(1, max_pages + 1):
            print(f"Fetching page {page}")

            params = {
                "opportunity": "hackathons",
                "page": page,
                "per_page": 18,
                "oppstatus": "open",
                "usertype": "students",
                "domain": 2,
            }

            res = await client.get(BASE_URL, params=params)
            data = res.json()

            items = data.get("data", {}).get("data", [])

            if not items:
                break

            for item in items:
                yield {
                    "external_id": item.get("id"),
                    "url": item.get("seo_url", ""),
                    "title": item.get("title"),
                    "description": clean_html(item.get("details")),
                    "college_name": item.get("organisation", {}).get("name"),

                    "team_size": {
                        "min": item.get("regnRequirements", {}).get("min_team_size"),
                        "max": item.get("regnRequirements", {}).get("max_team_size"),
                    },

                    "mode": item.get("region"),
                    "is_paid": item.get("isPaid"),

                    "start_date": item.get("regnRequirements", {}).get("start_regn_dt"),
                    "submission_deadline": item.get("end_date"),
                }