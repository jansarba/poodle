import { Poll } from '../../polls/entities/poll.entity';
import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'voter_name', type: 'text' })
  voterName!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, (user) => user.votes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'poll_id', type: 'uuid' })
  pollId!: string;

  @ManyToOne(() => Poll, (poll) => poll.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poll_id' })
  poll!: Poll;

  @Column('text', { array: true, name: 'selected_time_slots' })
  selectedTimeSlots!: string[];

  @CreateDateColumn({
    name: 'voted_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  votedAt!: Date;
}
