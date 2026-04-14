import httpx

DETAIL_URL = "https://unstop.com/api/public/competition/"

async def scrape_hackathon_detail(client, hackathon):
    try:
        url = DETAIL_URL + str(hackathon["external_id"])
        res = await client.get(url)
        data = res.json().get("data", {})
        competition = data.get("competition", {})

        # enrich description
        hackathon["description"] = competition.get("details") or hackathon["description"]

        # enrich dates (listing API often returns None)
        if competition.get("start_date") and not hackathon.get("start_date"):
            hackathon["start_date"] = competition["start_date"]
        if competition.get("end_date") and not hackathon.get("submission_deadline"):
            hackathon["submission_deadline"] = competition["end_date"]

        # enrich prizes
        if competition.get("prizes"):
            hackathon["prizes"] = competition["prizes"]

        return hackathon

    except Exception as e:
        print(f"Detail scrape failed for {hackathon['external_id']}: {e}")
        return hackathon