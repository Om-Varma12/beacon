import re
from typing import List, Dict

URL_RE = re.compile(r"https?://[^\s)'"]+")

KEYWORD_SCORES = {
    "problem": 10,
    "problem statement": 10,
    "challenge": 7,
    "theme": 8,
    "track": 6,
    "rules": 2,
    "use case": 9,
    "github": 5,
    "drive": 4,
    "docs": 4,
}


def extract_links(text: str) -> List[str]:
    if not text:
        return []
    return URL_RE.findall(text)


def score_links(urls: List[str]) -> List[Dict]:
    results = []
    for u in urls:
        score = 0
        low = u.lower()
        for k, v in KEYWORD_SCORES.items():
            if k in low:
                score += v
        # small weight for length and for obvious file extensions
        if any(low.endswith(ext) for ext in [".pdf", ".docx", ".pptx", ".txt"]):
            score += 3
        results.append({"url": u, "score": score})

    return sorted(results, key=lambda x: x["score"], reverse=True)
