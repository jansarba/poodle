import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Poll } from './polls/entities/poll.entity';
import { Vote } from './votes/entities/vote.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost', // jeśli baza lokalna
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'poodledb',
  synchronize: false,
  logging: false,
  entities: [User, Poll, Vote],
  migrations: ['src/migrations/*.ts'], // ścieżka do migracji
  subscribers: [],
});
