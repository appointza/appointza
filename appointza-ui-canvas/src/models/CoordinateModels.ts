
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coordinates: Coordinate;
  address: string;
}
