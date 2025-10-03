"""Utility script to POST sample sensor data payloads to the local API."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List

import requests


BASE_URL = "http://127.0.0.1:8000"
SENSOR_DATA_ENDPOINT = f"{BASE_URL}/api/v1/sensor-data"


def _now_iso() -> str:
	"""Return an ISO timestamp without timezone information."""

	return datetime.now().replace(microsecond=0).isoformat()


def build_payloads() -> List[Dict[str, Any]]:
	"""Create the sample payloads to post to the sensor-data endpoint."""

	return [
		{
			"lat": 14.676237,
			"lon": 120.521469,
			"lux": 42,
			"timestamp": _now_iso(),
			"sensor_name": "alpha",
		},
		{
			"lat": 14.679089,
			"lon": 120.533157,
			"lux": 36,
			"timestamp": _now_iso(),
			"sensor_name": "beta",
		},
		{
			"lat": 14.680712,
			"lon": 120.543227,
			"lux": 27,
			"timestamp": "2025-10-02T18:25:22.402",
			"sensor_name": "alpha",
		},
	]


def post_sensor_data() -> None:
	"""Send sample payloads to the running FastAPI backend."""

	payloads = build_payloads()

	for index, payload in enumerate(payloads, start=1):
		print(f"\nSending payload {index} to {SENSOR_DATA_ENDPOINT}:")
		print(json.dumps(payload, indent=2))

		try:
			response = requests.post(SENSOR_DATA_ENDPOINT, json=payload, timeout=10)
			response.raise_for_status()
		except requests.HTTPError as exc:
			print(f"HTTP error ({response.status_code}): {exc}")
			print("Response body:")
			print(response.text)
		except requests.RequestException as exc:
			print(f"Request failed: {exc}")
		else:
			print(f"Success! Status: {response.status_code}")
			try:
				print(json.dumps(response.json(), indent=2))
			except ValueError:
				print(response.text)


if __name__ == "__main__":
	post_sensor_data()

