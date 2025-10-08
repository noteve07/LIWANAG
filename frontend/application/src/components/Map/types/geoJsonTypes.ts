export interface GeoJSONStreet {
  type: 'Feature';
  properties: {
    id: number;
    name: string;
    [key: string]: any;
  };
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][];
  };
}