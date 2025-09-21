#!/usr/bin/env python3
import json

# Load data
barangays = json.load(open('barangays.json'))
illumination = json.load(open('illumination_data_new.json'))

print("=== BARANGAYS ===")
print(f"Total barangays: {len(barangays)}")
print("First 10 barangays:")
for i, b in enumerate(barangays[:10]):
    print(f"  {i+1}. ID: {b['id']}, Name: '{b['name']}'")

print("\n=== ILLUMINATION DATA ===")
print(f"Total illumination points: {len(illumination)}")
print("Unique barangay IDs in illumination data:")
unique_barangay_ids = set(point['barangay_id'] for point in illumination)
print(f"  {sorted(unique_barangay_ids)}")

print("\n=== MATCHING CHECK ===")
allowed_names = ['Poblacion', 'Ibayo', 'Tenejero', 'Talisay', 'Puerto Rivas Lote', 'Dona Francisca', 'Malabia', 'Cupang West', 'Cupang North', 'Bagumbayan']

print("Barangays matching allowed names:")
for barangay in barangays:
    if barangay['name'] in allowed_names:
        print(f"  ID: {barangay['id']}, Name: '{barangay['name']}'")

print("\nIllumination points in allowed barangays:")
allowed_ids = [b['id'] for b in barangays if b['name'] in allowed_names]
print(f"Allowed barangay IDs: {allowed_ids}")

matching_points = [p for p in illumination if p['barangay_id'] in allowed_ids]
print(f"Points in allowed barangays: {len(matching_points)}")
