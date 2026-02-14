// Type declaration for GeoJSON imports
declare module '*.geojson' {
  const value: {
    type: string;
    features: Array<{
      type: string;
      geometry: {
        type: string;
        coordinates: [number, number];
      };
      properties: Record<string, unknown>;
    }>;
  };
  export default value;
}
