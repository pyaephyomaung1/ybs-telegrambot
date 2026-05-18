export interface SessionStopChoice {
  id: number;
  name: string;
  township: {
    name: string;
  };
}

export class Session {
  id!: number;
  telegramId!: number;
  state!: string;
  tempData!: SessionStopChoice[] | null;
  updatedAt!: Date;
}
