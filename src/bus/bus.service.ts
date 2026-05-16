// src/bus/bus.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusLineStop } from '../entities/bus-line-stop.entity';
import { Stop } from '../entities/stop.entity';

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(BusLineStop)
    private readonly busLineStopRepo: Repository<BusLineStop>,

    @InjectRepository(Stop)
    private readonly stopRepo: Repository<Stop>,
  ) {}

  // Search by bus number → return all stops in order
  async getStopsByBusNumber(busNumber: string): Promise<BusLineStop[]> {
    return this.busLineStopRepo.find({
      where: { busLine: { number: busNumber } },
      relations: ['busLine', 'stop', 'stop.township'],
      order: { stopOrder: 'ASC' },
    });
  }

  // Search stops by name (partial match, case insensitive)
  async searchStops(name: string): Promise<Stop[]> {
    return this.stopRepo
      .createQueryBuilder('stop')
      .leftJoinAndSelect('stop.township', 'township')
      .where('stop.name ILIKE :name', { name: `%${name}%` })
      .getMany();
  }

  // Get all buses passing through a specific stop
  async getBusesByStop(stopId: number): Promise<BusLineStop[]> {
    return this.busLineStopRepo.find({
      where: { stop: { id: stopId } },
      relations: ['busLine', 'stop', 'stop.township'],
      order: { stopOrder: 'ASC' },
    });
  }
}
