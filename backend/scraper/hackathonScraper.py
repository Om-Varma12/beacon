import re
import httpx

DETAIL_URL = "https://unstop.com/api/public/competition/"


def parse_description(raw_html: str) -> str:
    """
    Converts HTML description into clean plain text.
    Removes tags, scripts, styles, extra spaces, and HTML entities.
    """

    if not raw_html:
        return ""

    # Remove script/style blocks
    raw_html = re.sub(r"<script.*?>.*?</script>", "", raw_html, flags=re.DOTALL)
    raw_html = re.sub(r"<style.*?>.*?</style>", "", raw_html, flags=re.DOTALL)

    # Remove all HTML tags
    text = re.sub(r"<[^>]+>", " ", raw_html)

    # Replace HTML entities
    text = (
        text.replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", '"')
            .replace("&#39;", "'")
    )

    # Remove extra spaces/newlines
    text = re.sub(r"\s+", " ", text).strip()

    return text


async def scrape_hackathon_detail(client, hackathon):
    try:
        url = DETAIL_URL + str(hackathon["external_id"])
        res = await client.get(url)

        data = res.json().get("data", {})
        competition = data.get("competition", {})

        # enrich description + parse HTML
        detailed_description = competition.get("details")

        if detailed_description:
            hackathon["description"] = parse_description(detailed_description)

        # enrich dates
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