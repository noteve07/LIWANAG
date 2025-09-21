import type { SensorData } from '../types/sensor';

// Hardcoded sample data with real barangay names and streets in Balanga City, Bataan
export const sampleApiResponse = {
  data: [
    {
      id: 1,
      lat: 14.680598,
      lon: 120.543051,
      lux: 850,
      barangay: "Poblacion",
      street: "Rizal Street",
      timestamp: "2024-09-27T10:00:00",
      sensor_name: "BLG-001",
      uploaded_at: "2025-09-13T22:49:57.280631+00:00"
    },
    {
      id: 2,
      lat: 14.680858,
      lon: 120.543454,
      lux: 50,
      barangay: "Poblacion",
      street: "Bonifacio Street",
      timestamp: "2024-09-27T10:02:00",
      sensor_name: "BLG-002",
      uploaded_at: "2025-09-13T22:50:00.914462+00:00"
    },
    {
      id: 3,
      lat: 14.681123,
      lon: 120.543789,
      lux: 900,
      barangay: "Poblacion",
      street: "Mabini Street",
      timestamp: "2024-09-27T10:03:00",
      sensor_name: "BLG-003",
      uploaded_at: "2025-09-13T22:50:03.213014+00:00"
    },
    {
      id: 4,
      lat: 14.681456,
      lon: 120.544123,
      lux: 30,
      barangay: "Poblacion",
      street: "Plaza Mayor",
      timestamp: "2024-09-27T10:04:00",
      sensor_name: "BLG-004",
      uploaded_at: "2025-09-13T22:50:05.480482+00:00"
    },
    {
      id: 5,
      lat: 14.680712,
      lon: 120.543227,
      lux: 420,
      barangay: "Poblacion",
      street: "Capitol Drive",
      timestamp: "2024-09-27T10:01:00",
      sensor_name: "BLG-005",
      uploaded_at: "2025-09-13T07:38:27.073882+00:00"
    },
    {
      id: 6,
      lat: 14.672598,
      lon: 120.533051,
      lux: 750,
      barangay: "Cataning",
      street: "Cataning Main Road",
      timestamp: "2024-09-27T11:00:00",
      sensor_name: "BLG-006",
      uploaded_at: "2025-09-13T23:37:44.966724+00:00"
    },
    {
      id: 7,
      lat: 14.673123,
      lon: 120.533789,
      lux: 200,
      barangay: "Cataning",
      street: "San Jose Road",
      timestamp: "2024-09-27T11:03:00",
      sensor_name: "BLG-007",
      uploaded_at: "2025-09-13T23:37:50.845341+00:00"
    },
    {
      id: 8,
      lat: 14.673456,
      lon: 120.534123,
      lux: 300,
      barangay: "Cataning",
      street: "Talisay Road",
      timestamp: "2024-09-27T11:04:00",
      sensor_name: "BLG-008",
      uploaded_at: "2025-09-13T23:37:53.254547+00:00"
    },
    {
      id: 9,
      lat: 14.664598,
      lon: 120.548051,
      lux: 120,
      barangay: "Tortugas",
      street: "Tortugas Beach Road",
      timestamp: "2024-09-27T12:00:00",
      sensor_name: "BLG-009",
      uploaded_at: "2025-09-14T01:38:50.792753+00:00"
    },
    {
      id: 10,
      lat: 14.665123,
      lon: 120.548789,
      lux: 90,
      barangay: "Tortugas",
      street: "Fisherman's Wharf",
      timestamp: "2024-09-27T12:03:00",
      sensor_name: "BLG-010",
      uploaded_at: "2025-09-14T01:38:58.48447+00:00"
    },
    {
      id: 11,
      lat: 14.688598,
      lon: 120.553051,
      lux: 550,
      barangay: "Cupang Proper",
      street: "Cupang Road",
      timestamp: "2024-09-27T13:00:00",
      sensor_name: "BLG-011",
      uploaded_at: "2025-09-14T02:39:20.127523+00:00"
    },
    {
      id: 12,
      lat: 14.689123,
      lon: 120.553789,
      lux: 600,
      barangay: "Cupang Proper",
      street: "Villa Teresa",
      timestamp: "2024-09-27T13:03:00",
      sensor_name: "BLG-012",
      uploaded_at: "2025-09-14T02:39:47.011245+00:00"
    },
    {
      id: 13,
      lat: 14.683456,
      lon: 120.541123,
      lux: 330,
      barangay: "Central",
      street: "University Avenue",
      timestamp: "2024-09-27T14:04:00",
      sensor_name: "BLG-013",
      uploaded_at: "2025-09-14T03:37:53.254547+00:00"
    },
    {
      id: 14,
      lat: 14.683598,
      lon: 120.541051,
      lux: 430,
      barangay: "Central",
      street: "Roman Highway",
      timestamp: "2024-09-27T14:00:00",
      sensor_name: "BLG-014",
      uploaded_at: "2025-09-14T03:38:50.792753+00:00"
    },
    {
      id: 15,
      lat: 14.678598,
      lon: 120.528051,
      lux: 80,
      barangay: "Puerto Rivas Ibaba",
      street: "Marina Boulevard",
      timestamp: "2024-09-27T15:00:00",
      sensor_name: "BLG-015",
      uploaded_at: "2025-09-14T04:38:50.792753+00:00"
    },
    {
      id: 16,
      lat: 14.679123,
      lon: 120.528789,
      lux: 110,
      barangay: "Puerto Rivas Ibaba",
      street: "Coastal Road",
      timestamp: "2024-09-27T15:03:00",
      sensor_name: "BLG-016",
      uploaded_at: "2025-09-14T04:38:58.48447+00:00"
    },
    {
      id: 17,
      lat: 14.677598,
      lon: 120.531051,
      lux: 190,
      barangay: "Puerto Rivas Itaas",
      street: "Bataan Heroes Street",
      timestamp: "2024-09-27T16:00:00",
      sensor_name: "BLG-017",
      uploaded_at: "2025-09-14T05:38:50.792753+00:00"
    },
    {
      id: 18,
      lat: 14.678123,
      lon: 120.531789,
      lux: 210,
      barangay: "Puerto Rivas Itaas",
      street: "Freedom Road",
      timestamp: "2024-09-27T16:03:00",
      sensor_name: "BLG-018",
      uploaded_at: "2025-09-14T05:38:58.48447+00:00"
    },
    {
      id: 19,
      lat: 14.670598,
      lon: 120.538051,
      lux: 490,
      barangay: "Tuyo",
      street: "Tuyo Road",
      timestamp: "2024-09-27T17:00:00",
      sensor_name: "BLG-019",
      uploaded_at: "2025-09-14T06:38:50.792753+00:00"
    },
    {
      id: 20,
      lat: 14.671123,
      lon: 120.538789,
      lux: 520,
      barangay: "Tuyo",
      street: "Farmers Avenue",
      timestamp: "2024-09-27T17:03:00",
      sensor_name: "BLG-020",
      uploaded_at: "2025-09-14T06:38:58.48447+00:00"
    },
    {
      id: 21,
      lat: 14.675598,
      lon: 120.546051,
      lux: 780,
      barangay: "Bagong Silang",
      street: "Tandoc Street",
      timestamp: "2024-09-27T18:00:00",
      sensor_name: "BLG-021",
      uploaded_at: "2025-09-14T07:38:50.792753+00:00"
    },
    {
      id: 22,
      lat: 14.676123,
      lon: 120.546789,
      lux: 810,
      barangay: "Bagong Silang",
      street: "Espino Avenue",
      timestamp: "2024-09-27T18:03:00",
      sensor_name: "BLG-022",
      uploaded_at: "2025-09-14T07:38:58.48447+00:00"
    },
    {
      id: 23,
      lat: 14.668598,
      lon: 120.542051,
      lux: 270,
      barangay: "Tenejero",
      street: "Don Manuel Road",
      timestamp: "2024-09-27T19:00:00",
      sensor_name: "BLG-023",
      uploaded_at: "2025-09-14T08:38:50.792753+00:00"
    },
    {
      id: 24,
      lat: 14.669123,
      lon: 120.542789,
      lux: 290,
      barangay: "Tenejero",
      street: "Del Pilar Street",
      timestamp: "2024-09-27T19:03:00",
      sensor_name: "BLG-024",
      uploaded_at: "2025-09-14T08:38:58.48447+00:00"
    },
    {
      id: 25,
      lat: 14.673598,
      lon: 120.551051,
      lux: 340,
      barangay: "Bagumbayan",
      street: "Aguinaldo Street",
      timestamp: "2024-09-27T20:00:00",
      sensor_name: "BLG-025",
      uploaded_at: "2025-09-14T09:38:50.792753+00:00"
    },
    {
      id: 26,
      lat: 14.674123,
      lon: 120.551789,
      lux: 370,
      barangay: "Bagumbayan",
      street: "Progress Road",
      timestamp: "2024-09-27T20:03:00",
      sensor_name: "BLG-026",
      uploaded_at: "2025-09-14T09:38:58.48447+00:00"
    },
    {
      id: 27,
      lat: 14.672598,
      lon: 120.547051,
      lux: 410,
      barangay: "Cupang North",
      street: "North Boulevard",
      timestamp: "2024-09-27T21:00:00",
      sensor_name: "BLG-027",
      uploaded_at: "2025-09-14T10:38:50.792753+00:00"
    },
    {
      id: 28,
      lat: 14.673123,
      lon: 120.547789,
      lux: 440,
      barangay: "Cupang North",
      street: "Sunshine Avenue",
      timestamp: "2024-09-27T21:03:00",
      sensor_name: "BLG-028",
      uploaded_at: "2025-09-14T10:38:58.48447+00:00"
    },
    {
      id: 29,
      lat: 14.671598,
      lon: 120.549051,
      lux: 380,
      barangay: "Cupang West",
      street: "West View Street",
      timestamp: "2024-09-27T22:00:00",
      sensor_name: "BLG-029",
      uploaded_at: "2025-09-14T11:38:50.792753+00:00"
    },
    {
      id: 30,
      lat: 14.672123,
      lon: 120.549789,
      lux: 350,
      barangay: "Cupang West",
      street: "Sunset Drive",
      timestamp: "2024-09-27T22:03:00",
      sensor_name: "BLG-030",
      uploaded_at: "2025-09-14T11:38:58.48447+00:00"
    },
    {
      id: 31,
      lat: 14.676598,
      lon: 120.537051,
      lux: 230,
      barangay: "Talisay",
      street: "Beachfront Road",
      timestamp: "2024-09-27T23:00:00",
      sensor_name: "BLG-031",
      uploaded_at: "2025-09-14T12:38:50.792753+00:00"
    },
    {
      id: 32,
      lat: 14.677123,
      lon: 120.537789,
      lux: 250,
      barangay: "Talisay",
      street: "Hillside Avenue",
      timestamp: "2024-09-27T23:03:00",
      sensor_name: "BLG-032",
      uploaded_at: "2025-09-14T12:38:58.48447+00:00"
    },
    {
      id: 33,
      lat: 14.679598,
      lon: 120.534051,
      lux: 280,
      barangay: "Malabia",
      street: "Mango Street",
      timestamp: "2024-09-28T00:00:00",
      sensor_name: "BLG-033",
      uploaded_at: "2025-09-14T13:38:50.792753+00:00"
    },
    {
      id: 34,
      lat: 14.680123,
      lon: 120.534789,
      lux: 320,
      barangay: "Malabia",
      street: "Rice Field Avenue",
      timestamp: "2024-09-28T00:03:00",
      sensor_name: "BLG-034",
      uploaded_at: "2025-09-14T13:38:58.48447+00:00"
    },
    {
      id: 35,
      lat: 14.681598,
      lon: 120.536051,
      lux: 530,
      barangay: "Ibayo",
      street: "Riverside Drive",
      timestamp: "2024-09-28T01:00:00",
      sensor_name: "BLG-035",
      uploaded_at: "2025-09-14T14:38:50.792753+00:00"
    },
    {
      id: 36,
      lat: 14.682123,
      lon: 120.536789,
      lux: 560,
      barangay: "Ibayo",
      street: "Palm Street",
      timestamp: "2024-09-28T01:03:00",
      sensor_name: "BLG-036",
      uploaded_at: "2025-09-14T14:38:58.48447+00:00"
    },
    {
      id: 37,
      lat: 14.680598,
      lon: 120.553051,
      lux: 150,
      barangay: "Sibacan",
      street: "River Road",
      timestamp: "2024-09-28T02:00:00",
      sensor_name: "BLG-037",
      uploaded_at: "2025-09-14T15:38:50.792753+00:00"
    },
    {
      id: 38,
      lat: 14.681123,
      lon: 120.553789,
      lux: 180,
      barangay: "Sibacan",
      street: "Bridge Street",
      timestamp: "2024-09-28T02:03:00",
      sensor_name: "BLG-038",
      uploaded_at: "2025-09-14T15:38:58.48447+00:00"
    },
    {
      id: 39,
      lat: 14.684598,
      lon: 120.545051,
      lux: 720,
      barangay: "San Jose",
      street: "Church Street",
      timestamp: "2024-09-28T03:00:00",
      sensor_name: "BLG-039",
      uploaded_at: "2025-09-14T16:38:50.792753+00:00"
    },
    {
      id: 40,
      lat: 14.685123,
      lon: 120.545789,
      lux: 680,
      barangay: "San Jose",
      street: "School Road",
      timestamp: "2024-09-28T03:03:00",
      sensor_name: "BLG-040",
      uploaded_at: "2025-09-14T16:38:58.48447+00:00"
    },
    {
      id: 41,
      lat: 14.667598,
      lon: 120.544051,
      lux: 130,
      barangay: "Cabog-Cabog",
      street: "Farmer's Road",
      timestamp: "2024-09-28T04:00:00",
      sensor_name: "BLG-041",
      uploaded_at: "2025-09-14T17:38:50.792753+00:00"
    },
    {
      id: 42,
      lat: 14.668123,
      lon: 120.544789,
      lux: 170,
      barangay: "Cabog-Cabog",
      street: "Mountain View",
      timestamp: "2024-09-28T04:03:00",
      sensor_name: "BLG-042",
      uploaded_at: "2025-09-14T17:38:58.48447+00:00"
    },
    {
      id: 43,
      lat: 14.682598,
      lon: 120.547051,
      lux: 890,
      barangay: "Doña Francisca",
      street: "Heritage Drive",
      timestamp: "2024-09-28T05:00:00",
      sensor_name: "BLG-043",
      uploaded_at: "2025-09-14T18:38:50.792753+00:00"
    },
    {
      id: 44,
      lat: 14.683123,
      lon: 120.547789,
      lux: 860,
      barangay: "Doña Francisca",
      street: "Garden Street",
      timestamp: "2024-09-28T05:03:00",
      sensor_name: "BLG-044",
      uploaded_at: "2025-09-14T18:38:58.48447+00:00"
    },
    {
      id: 45,
      lat: 14.670598,
      lon: 120.554051,
      lux: 60,
      barangay: "Dangcol",
      street: "Fishpond Road",
      timestamp: "2024-09-28T06:00:00",
      sensor_name: "BLG-045",
      uploaded_at: "2025-09-14T19:38:50.792753+00:00"
    },
    {
      id: 46,
      lat: 14.671123,
      lon: 120.554789,
      lux: 70,
      barangay: "Dangcol",
      street: "Aquaculture Avenue",
      timestamp: "2024-09-28T06:03:00",
      sensor_name: "BLG-046",
      uploaded_at: "2025-09-14T19:38:58.48447+00:00"
    },
    {
      id: 47,
      lat: 14.686598,
      lon: 120.537051,
      lux: 480,
      barangay: "Munting Batangas",
      street: "Coastal Highway",
      timestamp: "2024-09-28T07:00:00",
      sensor_name: "BLG-047",
      uploaded_at: "2025-09-14T20:38:50.792753+00:00"
    },
    {
      id: 48,
      lat: 14.687123,
      lon: 120.537789,
      lux: 510,
      barangay: "Munting Batangas",
      street: "Shoreline Drive",
      timestamp: "2024-09-28T07:03:00",
      sensor_name: "BLG-048",
      uploaded_at: "2025-09-14T20:38:58.48447+00:00"
    },
    {
      id: 49,
      lat: 14.668598,
      lon: 120.548051,
      lux: 390,
      barangay: "Lote",
      street: "Old Highway",
      timestamp: "2024-09-28T08:00:00",
      sensor_name: "BLG-049",
      uploaded_at: "2025-09-14T21:38:50.792753+00:00"
    },
    {
      id: 50,
      lat: 14.669123,
      lon: 120.548789,
      lux: 420,
      barangay: "Lote",
      street: "Farm Road",
      timestamp: "2024-09-28T08:03:00",
      sensor_name: "BLG-050",
      uploaded_at: "2025-09-14T21:38:58.48447+00:00"
    }
  ],
  count: null
};

// For legacy support, keep the dynamic generation function but we won't use it
export const generateSampleData = (): SensorData[] => {
  return sampleApiResponse.data;
};