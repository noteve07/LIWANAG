"""Utility script to normalize legacy analytics data.

Steps performed:
1. Load the non-standard JSON payload from `old_data.json`.
2. Normalize object keys so they are quoted strings and parse as JSON.
3. Scale each sensor's `lux` reading into the 6–18 range while keeping
   the relative distribution intact.
4. Persist the transformed payload into `new_data.json`.

All other fields remain untouched.
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any, Dict, List


BASE_DIR = Path(__file__).parent
SOURCE_PATH = BASE_DIR / "old_data.json"
OUTPUT_PATH = BASE_DIR / "new_data.json"


def load_legacy_payload(path: Path) -> Dict[str, Any]:
	"""Load the legacy JSON-like structure and convert it to valid JSON."""

	raw_text = path.read_text(encoding="utf-8")

	# Strip trailing semicolons that make the payload non JSON compliant.
	sanitized = raw_text.rstrip().rstrip(";")

	# Quote object keys (e.g., `id:` -> "id":) using a conservative regex.
	sanitized = re.sub(
		r"(?P<prefix>[{,\s])(?P<key>[A-Za-z_][A-Za-z0-9_-]*)\s*:",
		lambda match: f'{match.group("prefix")}"{match.group("key")}":',
		sanitized,
	)

	# Ensure the payload is valid JSON
	try:
		payload = json.loads(sanitized)
	except json.JSONDecodeError as exc:
		raise ValueError("Unable to parse legacy JSON payload") from exc

	if not isinstance(payload, dict) or "data" not in payload:
		raise ValueError("Payload does not contain a top-level 'data' key")

	return payload


def scale_lux_values(records: List[Dict[str, Any]], *, min_target: float = 6.0, max_target: float = 18.0) -> None:
	"""Scale the `lux` readings in-place to the specified range."""

	if not records:
		return

	lux_values = [record.get("lux", 0) for record in records]
	min_lux = min(lux_values)
	max_lux = max(lux_values)

	# Avoid division by zero when all lux values are identical.
	if math.isclose(min_lux, max_lux):
		for record in records:
			record["lux"] = round((min_target + max_target) / 2, 2)
		return

	scale = max_target - min_target
	range_span = max_lux - min_lux

	for record in records:
		original = record.get("lux", 0)
		normalized = (original - min_lux) / range_span
		scaled = min_target + normalized * scale
		record["lux"] = round(scaled, 2)


def main() -> None:
	payload = load_legacy_payload(SOURCE_PATH)
	records = payload.get("data", [])

	if not isinstance(records, list):
		raise ValueError("Expected 'data' to be a list")

	scale_lux_values(records)

	OUTPUT_PATH.write_text(
		json.dumps(payload, indent=2, ensure_ascii=False),
		encoding="utf-8",
	)

	print(f"Transformed data written to {OUTPUT_PATH.relative_to(Path.cwd())}")


if __name__ == "__main__":
	main()
