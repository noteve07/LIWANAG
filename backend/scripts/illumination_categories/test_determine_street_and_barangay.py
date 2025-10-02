import math
import os
from typing import Any, Dict, Iterable, List, Optional, Tuple

from dotenv import load_dotenv
from shapely.geometry import Point, shape
from shapely.geometry.base import BaseGeometry
from supabase import Client, create_client


def initialise_client() -> Client:
	"""Load environment variables and initialise the Supabase client."""

	load_dotenv()

	url = os.environ.get("SUPABASE_URL")
	key = os.environ.get("SUPABASE_KEY")

	if not url or not key:
		raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in the environment.")

	return create_client(url, key)


def fetch_all_rows(client: Client, table: str, columns: str, chunk_size: int = 1000) -> List[Dict[str, Any]]:
	"""Fetch every row from a Supabase table, handling the default pagination."""

	rows: List[Dict[str, Any]] = []
	start = 0

	while True:
		end = start + chunk_size - 1
		response = client.table(table).select(columns).range(start, end).execute()
		batch = response.data or []
		rows.extend(batch)

		if len(batch) < chunk_size:
			break

		start += chunk_size

	return rows


def geom_from_record(record: Dict[str, Any], field: str) -> Optional[BaseGeometry]:
	geometry_payload = record.get(field)
	if not geometry_payload:
		return None

	try:
		return shape(geometry_payload)
	except Exception:
		return None


def determine_barangay(client: Client, point: Point) -> Optional[Dict[str, Any]]:
	barangays = fetch_all_rows(client, "barangays", "id, name, boundary")

	for record in barangays:
		geometry = geom_from_record(record, "boundary")
		if geometry is None:
			continue

		# Buffer slightly to cover boundary edge cases
		if geometry.contains(point) or geometry.buffer(1e-9).contains(point):
			return record

	return None


def determine_nearest_street(client: Client, point: Point) -> Optional[Tuple[Dict[str, Any], float]]:
	streets = fetch_all_rows(client, "streets", "id, name, geometry")

	nearest: Optional[Tuple[Dict[str, Any], float]] = None

	for record in streets:
		geometry = geom_from_record(record, "geometry")
		if geometry is None:
			continue

		distance = point.distance(geometry)

		if nearest is None or distance < nearest[1]:
			nearest = (record, distance)

	return nearest


def degrees_to_meters(distance_degrees: float, latitude: float) -> float:
	"""Approximate conversion from degrees to metres for small distances."""

	# Mean radius of Earth in metres
	earth_radius = 6_371_000
	# Convert degrees to radians for latitude
	lat_rad = math.radians(latitude)

	# Approximate conversion factors
	metres_per_degree_lat = (math.pi * earth_radius) / 180
	metres_per_degree_lon = metres_per_degree_lat * math.cos(lat_rad)

	# Using Euclidean approximation in degree space
	return distance_degrees * max(metres_per_degree_lat, metres_per_degree_lon)


def main() -> None:
	client = initialise_client()

	latitude = 14.680712
	longitude = 120.543227

	query_point = Point(longitude, latitude)

	barangay = determine_barangay(client, query_point)
	street_info = determine_nearest_street(client, query_point)

	print("Results for point (lat: {:.6f}, lon: {:.6f})".format(latitude, longitude))
	print("-" * 60)

	if street_info:
		street_record, distance = street_info
		distance_metres = degrees_to_meters(distance, latitude)
		print("Street ID: {}".format(street_record.get("id")))
		print("Street Name: {}".format(street_record.get("name") or "<unnamed>"))
		print("Distance to street: {:.2f} metres (approx.)".format(distance_metres))
	else:
		print("Street: No matching street found")

	print()

	if barangay:
		print("Barangay ID: {}".format(barangay.get("id")))
		print("Barangay Name: {}".format(barangay.get("name")))
	else:
		print("Barangay: No containing barangay found")


if __name__ == "__main__":
	main()

