// src/entities/session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

export interface SessionStopChoice {
  id: number;
  name: string;
  township: {
    name: string;
  };
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'telegram_id', unique: true, type: 'bigint' })
  telegramId!: number;

  @Column({ default: 'IDLE' })
  state!: string; // IDLE | WAITING_BUS_NUMBER | WAITING_STOP_NAME | WAITING_STOP_CHOICE

  @Column({ name: 'temp_data', type: 'jsonb', nullable: true })
  tempData!: SessionStopChoice[] | null; // stores intermediate data like list of duplicate stops

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
