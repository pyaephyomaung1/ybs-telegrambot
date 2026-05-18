// src/bus/bus.service.ts
import { Injectable } from '@nestjs/common';
import {
  busLines,
  busLineStops,
  BusLineStopSeed,
  stops,
  StopSeed,
  townships,
} from '../data';
import { BusLineStop } from '../entities/bus-line-stop.entity';
import { Stop } from '../entities/stop.entity';
import { Township } from '../entities/township.entity';
import { BusLine } from '../entities/bus-line.entity';
import { normalizeMyanmarDigits } from '../telegram/number.util';

@Injectable()
export class BusService {
  // Search by bus number → return all stops in order
  getStopsByBusNumber(busNumber: string): Promise<BusLineStop[]> {
    const normalizedBusNumber = busNumber.toLocaleLowerCase();
    const exactMatches = busLines.filter(
      (line) => line.number.toLocaleLowerCase() === normalizedBusNumber,
    );
    const busLineMatches =
      exactMatches.length > 0
        ? exactMatches
        : busLines.filter(
            (line) =>
              line.baseNumber.toLocaleLowerCase() === normalizedBusNumber,
          );
    if (busLineMatches.length === 0) return Promise.resolve([]);

    const busLineIds = new Set(busLineMatches.map((line) => line.id));

    const results = busLineStops
      .filter((busLineStop) => busLineIds.has(busLineStop.busLineId))
      .sort((a, b) =>
        a.busLineId === b.busLineId
          ? a.stopOrder - b.stopOrder
          : a.busLineId - b.busLineId,
      )
      .map((busLineStop) => this.toBusLineStopEntity(busLineStop));

    return Promise.resolve(results);
  }

  // Search stops by name (partial match, case insensitive)
  searchStops(name: string): Promise<Stop[]> {
    const normalizedName = this.normalizeSearchText(name);

    const results = stops
      .filter((stop) =>
        [stop.name, stop.nameEn, stop.nameMm, stop.roadEn, stop.roadMm]
          .filter(Boolean)
          .some((value) =>
            this.normalizeSearchText(value).includes(normalizedName),
          ),
      )
      .map((stop) => this.toStopEntity(stop));

    return Promise.resolve(results);
  }

  searchExactStops(name: string): Promise<Stop[]> {
    const normalizedName = this.normalizeSearchText(name);

    const results = stops
      .filter((stop) =>
        [stop.name, stop.nameEn, stop.nameMm]
          .filter(Boolean)
          .some((value) => this.normalizeSearchText(value) === normalizedName),
      )
      .map((stop) => this.toStopEntity(stop));

    return Promise.resolve(results);
  }

  searchTownships(name: string): Promise<Township[]> {
    const normalizedName = this.normalizeSearchText(name);

    const results = townships
      .filter((township) =>
        [township.name, township.nameEn]
          .filter(Boolean)
          .some((value) =>
            this.normalizeSearchText(value).includes(normalizedName),
          ),
      )
      .map((township) => ({
        id: township.id,
        name: township.name,
        stops: [],
      }));

    return Promise.resolve(results);
  }

  getBusesByTownship(townshipId: number): Promise<BusLine[]> {
    const stopIdsInTownship = new Set(
      stops
        .filter((stop) => stop.townshipId === townshipId)
        .map((stop) => stop.id),
    );
    const busLineIds = new Set(
      busLineStops
        .filter((busLineStop) => stopIdsInTownship.has(busLineStop.stopId))
        .map((busLineStop) => busLineStop.busLineId),
    );

    const results = busLines
      .filter((busLine) => busLineIds.has(busLine.id))
      .sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true }),
      )
      .map((busLine) => ({
        id: busLine.id,
        number: busLine.number,
        description: busLine.description,
        busLineStops: [],
      }));

    return Promise.resolve(results);
  }

  // Get all buses passing through a specific stop
  getBusesByStop(stopId: number): Promise<BusLineStop[]> {
    const results = busLineStops
      .filter((busLineStop) => busLineStop.stopId === stopId)
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .map((busLineStop) => this.toBusLineStopEntity(busLineStop));

    return Promise.resolve(results);
  }

  private toBusLineStopEntity(seed: BusLineStopSeed): BusLineStop {
    const busLineSeed = busLines.find(
      (busLine) => busLine.id === seed.busLineId,
    );
    const stopSeed = stops.find((stop) => stop.id === seed.stopId);

    if (!busLineSeed || !stopSeed) {
      throw new Error(
        `Invalid seed data for bus line ${seed.busLineId} and stop ${seed.stopId}`,
      );
    }

    return {
      id: busLineStops.indexOf(seed) + 1,
      busLine: {
        id: busLineSeed.id,
        number: busLineSeed.number,
        description: busLineSeed.description,
        busLineStops: [],
      },
      stop: this.toStopEntity(stopSeed),
      stopOrder: seed.stopOrder,
    };
  }

  private toStopEntity(seed: StopSeed): Stop {
    const townshipSeed = townships.find(
      (township) => township.id === seed.townshipId,
    );

    if (!townshipSeed) {
      throw new Error(`Invalid seed data for township ${seed.townshipId}`);
    }

    return {
      id: seed.id,
      name: seed.name,
      township: {
        id: townshipSeed.id,
        name: townshipSeed.name,
        stops: [],
      } satisfies Township,
      busLineStops: [],
    };
  }

  private normalizeSearchText(text: string): string {
    return normalizeMyanmarDigits(text)
      .toLocaleLowerCase()
      .replace(/[()[\]{}'"“”‘’၊။,\s-]+/g, '');
  }
}
