import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Poll } from '../../polls/entities/poll.entity';
import { Vote } from '../../votes/entities/vote.entity';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  full_name!: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ select: false, nullable: true })
  password?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @OneToMany(() => Poll, (poll) => poll.user)
  polls!: Poll[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes!: Vote[];
}
