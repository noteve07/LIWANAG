"""Generate a formatted list of streets for Highway and Secondary categories.

Usage (run from repository root or from this directory):

	python backend/scripts/road_categories/list_of_highway_and_secondary_streets.py

Optional flags:
	--markdown out.md   Write the output to a markdown file instead of only stdout
	--inspect           Print discovered property keys for debugging

The script looks for the files placed in the same directory:
	- highway.geojson
	- secondary.geojson

It tries to extract a street name from each feature by checking a list of
possible property keys (case-insensitive):
	name, street, street_name, road, road_name, fullname, full_name

Empty or missing names are ignored. Duplicates are removed while preserving
original insertion order.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import OrderedDict
from pathlib import Path
from typing import Iterable, List, Set

THIS_DIR = Path(__file__).parent

HIGHWAY_FILE = THIS_DIR / "highway.geojson"
SECONDARY_FILE = THIS_DIR / "secondary.geojson"

# Candidate property keys to try (lowercased)
NAME_KEYS = [
	"name",
	"street",
	"street_name",
	"road",
	"road_name",
	"fullname",
	"full_name",
]


def load_geojson(path: Path) -> dict:
	if not path.exists():
		raise FileNotFoundError(f"GeoJSON file not found: {path}")
	with path.open("r", encoding="utf-8") as f:
		return json.load(f)


def extract_name(props: dict) -> str | None:
	if not isinstance(props, dict):
		return None
	lower_map = {k.lower(): v for k, v in props.items()}
	for key in NAME_KEYS:
		if key in lower_map:
			val = lower_map[key]
			if isinstance(val, str):
				cleaned = val.strip()
				if cleaned:
					return cleaned
	return None


def collect_names(geojson_obj: dict) -> List[str]:
	features = geojson_obj.get("features") or []
	ordered: "OrderedDict[str, None]" = OrderedDict()
	for feat in features:
		if not isinstance(feat, dict):
			continue
		props = feat.get("properties", {})
		name = extract_name(props)
		if name:
			ordered.setdefault(name, None)
	return list(ordered.keys())


def discover_property_keys(geojson_obj: dict) -> Set[str]:
	keys: Set[str] = set()
	for feat in geojson_obj.get("features", []):
		props = feat.get("properties")
		if isinstance(props, dict):
			for k in props.keys():
				keys.add(k)
	return keys


def format_output(highway_names: Iterable[str], secondary_names: Iterable[str]) -> str:
	lines: List[str] = []
	lines.append("Highway:")
	for name in highway_names:
		lines.append(f"- {name}")
	lines.append("")
	lines.append("Secondary:")
	for name in secondary_names:
		lines.append(f"- {name}")
	return "\n".join(lines)


def main(argv: List[str] | None = None) -> int:
	parser = argparse.ArgumentParser(description="List highway & secondary street names from GeoJSON files")
	parser.add_argument("--markdown", metavar="PATH", help="Write output to markdown file as well")
	parser.add_argument("--inspect", action="store_true", help="Print discovered property keys for debugging")
	args = parser.parse_args(argv)

	try:
		highway_geo = load_geojson(HIGHWAY_FILE)
	except FileNotFoundError as e:
		print(e, file=sys.stderr)
		return 1
	try:
		secondary_geo = load_geojson(SECONDARY_FILE)
	except FileNotFoundError as e:
		print(e, file=sys.stderr)
		return 1

	highway_names = collect_names(highway_geo)
	secondary_names = collect_names(secondary_geo)

	if args.inspect:
		hw_keys = discover_property_keys(highway_geo)
		sec_keys = discover_property_keys(secondary_geo)
		print("[INSPECT] Highway property keys:", sorted(hw_keys))
		print("[INSPECT] Secondary property keys:", sorted(sec_keys))
		print()

	output = format_output(highway_names, secondary_names)
	print(output)

	if args.markdown:
		out_path = Path(args.markdown)
		out_path.write_text(output + "\n", encoding="utf-8")
		print(f"\nMarkdown written to {out_path}")

	return 0


if __name__ == "__main__":  # pragma: no cover
	raise SystemExit(main())

