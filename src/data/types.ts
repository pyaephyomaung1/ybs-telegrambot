export interface TownshipSeed {
  id: number;
  name: string;
  nameEn: string;
}

export interface BusLineSeed {
  id: number;
  number: string;
  baseNumber: string;
  description: string;
  color: string;
  agencyId: string;
  routeId: string;
  sourceFile: string;
}

export interface StopSeed {
  id: number;
  name: string;
  nameEn: string;
  nameMm: string;
  roadEn: string;
  roadMm: string;
  lat: number;
  lng: number;
  townshipId: number;
}

export interface BusLineStopSeed {
  busLineId: number;
  stopId: number;
  stopOrder: number;
}
