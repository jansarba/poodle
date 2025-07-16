import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vote } from '../../votes/entities/vote.entity';
import { User } from '../../users/entities/user.entity';

@Entity('polls')
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column('text', { array: true })
  timeSlots!: string[];

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.polls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => Vote, (vote) => vote.poll, { cascade: true })
  votes!: Vote[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
