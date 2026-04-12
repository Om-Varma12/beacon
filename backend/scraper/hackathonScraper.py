import httpx

DETAIL_URL = "https://unstop.com/api/public/competition/"

async def scrape_hackathon_detail(client, hackathon):
    try:
        url = DETAIL_URL + str(hackathon["external_id"])
        res = await client.get(url)
        data = res.json().get("data", {})

        # enrich description
        hackathon["description"] = data.get("description") or hackathon["description"]

        # enrich dates (listing API often returns None)
        if data.get("start_date") and not hackathon.get("start_date"):
            hackathon["start_date"] = data["start_date"]
        if data.get("end_date") and not hackathon.get("submission_deadline"):
            hackathon["submission_deadline"] = data["end_date"]

        # enrich prizes
        if data.get("prizes"):
            hackathon["prizes"] = data["prizes"]

        return hackathon

    except Exception as e:
        print(f"Detail scrape failed for {hackathon['external_id']}: {e}")
        return hackathon