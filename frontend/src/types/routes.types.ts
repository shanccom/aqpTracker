// src/types/routes.types.ts
export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface BusRoute {
  id: string;
  name: string;
  color: string;
  stops: RouteStop[];
}

export interface RouteSegment {
  from: string;
  to: string;
  distance: number;
  time: number;
  geometry?: any;
}

export interface RouteResults {
  totalDistance: number;
  totalTime: number;
  segmentCount: number;
  segments: RouteSegment[];
  isRealRoute: boolean;
}

export interface RouteInfo {
  totalStops: number;
  totalDistance: string;
  totalTime: number;
}