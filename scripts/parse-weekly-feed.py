#!/usr/bin/env python3
"""Parse bounded public RSS/Atom metadata. Never return full article bodies."""
import html
from html.parser import HTMLParser
import json
import sys
import xml.etree.ElementTree as ET

class TextOnly(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, value):
        self.parts.append(value)

def clean(value, limit):
    parser = TextOnly()
    parser.feed(html.unescape(value or ""))
    return " ".join(" ".join(parser.parts).split())[:limit]

def local(tag):
    return tag.rsplit("}", 1)[-1]

def parse(raw):
    if len(raw) > 2 * 1024 * 1024 or b"<!doctype" in raw.lower() or b"<!entity" in raw.lower():
        raise ValueError("Unsupported XML declaration or oversized feed")
    root = ET.fromstring(raw)
    if local(root.tag) not in ("rss", "feed", "RDF"):
        raise ValueError("Expected RSS or Atom feed")
    rows = []
    for node in root.iter():
        if local(node.tag) not in ("item", "entry"):
            continue
        fields = {}
        links = []
        for child in node:
            name = local(child.tag)
            fields.setdefault(name, "".join(child.itertext()))
            if name == "link":
                if child.attrib.get("rel", "alternate") == "alternate":
                    links.append(child.attrib.get("href") or "".join(child.itertext()))
        rows.append({
            "title": clean(fields.get("title"), 160),
            "url": links[0].strip() if links else "",
            "published_at": fields.get("published") or fields.get("pubDate") or fields.get("date") or fields.get("updated") or "",
            "date_kind": "published" if fields.get("published") or fields.get("pubDate") or fields.get("date") else "updated",
            "match_text": clean(fields.get("summary") or fields.get("description") or fields.get("content") or "", 2000),
        })
        if len(rows) >= 200:
            break
    return rows

if __name__ == "__main__":
    try:
        print(json.dumps(parse(sys.stdin.buffer.read(2 * 1024 * 1024 + 1)), ensure_ascii=False))
    except (ValueError, ET.ParseError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
