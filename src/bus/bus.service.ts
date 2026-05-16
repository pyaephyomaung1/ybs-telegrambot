// src/bus/bus.service.ts
import { Injectable } from '@nestjs/common';
import {
  busLines,
  busLineStops,
  BusLineStopSeed,
  stops,
  StopSeed,
  townships,
} from '../seed';
import { BusLineStop } from '../entities/bus-line-stop.entity';
import { Stop } from '../entities/stop.entity';
import { Township } from '../entities/township.entity';

@Injectable()
export class BusService {
  // Search by bus number → return all stops in order
  getStopsByBusNumber(busNumber: string): Promise<BusLineStop[]> {
    const busLine = busLines.find((line) => line.number === busNumber);
    if (!busLine) return Promise.resolve([]);

    const results = busLineStops
      .filter((busLineStop) => busLineStop.busLineId === busLine.id)
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .map((busLineStop) => this.toBusLineStopEntity(busLineStop));

    return Promise.resolve(results);
  }

  // Search stops by name (partial match, case insensitive)
  searchStops(name: string): Promise<Stop[]> {
    const normalizedName = name.toLocaleLowerCase();

    const results = stops
      .filter((stop) => stop.name.toLocaleLowerCase().includes(normalizedName))
      .map((stop) => this.toStopEntity(stop));

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
}
