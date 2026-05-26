import asyncio
from typing import List, Dict

from .document_parser import DocumentParser
from utils.link_extractor import extract_links, score_links


class ProblemContextBuilder:
    def __init__(self):
        self.doc_parser = DocumentParser()

    async def _parse_resource(self, resource: dict) -> dict:
        # resource is expected to have a URL-like field
        url = resource.get("url") or resource.get("link") or resource.get("href")
        if not url:
            return {"source_url": None, "source_type": None, "text": "", "confidence": 0.0}
        try:
            parsed = await self.doc_parser.parse(url)
            return parsed
        except Exception:
            return {"source_url": url, "source_type": "error", "text": "", "confidence": 0.0}

    async def build(self, enriched: dict) -> Dict:
        description = enriched.get("description", "") or ""

        resources = enriched.get("resources", []) or []

        # Parse resources concurrently
        tasks = [self._parse_resource(r) for r in resources]
        resource_contexts = []
        if tasks:
            parsed = await asyncio.gather(*tasks)
            for p in parsed:
                resource_contexts.append(p)

        # Extract links from description
        desc_links = extract_links(description)
        scored = score_links(desc_links)

        external_contexts = []
        # For high scoring external links that appear to be files, attempt parsing
        for item in scored:
            url = item.get("url")
            if not url:
                continue
            # simple heuristic: parse if extension looks like a document
            lower = url.lower()
            if any(lower.endswith(ext) for ext in [".pdf", ".docx", ".txt", ".pptx"]):
                try:
                    parsed = await self.doc_parser.parse(url)
                    external_contexts.append(parsed)
                except Exception:
                    continue

        combined_items = [description]
        for r in resource_contexts:
            if r.get("text"):
                combined_items.append(r.get("text"))
        for e in external_contexts:
            if e.get("text"):
                combined_items.append(e.get("text"))

        combined_context = "\n\n".join(combined_items)

        return {
            "description": description,
            "resource_contexts": resource_contexts,
            "external_contexts": external_contexts,
            "links": scored,
            "combined_context": combined_context,
        }
