import {
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVoteDto {
  @IsString({ message: 'Voter name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Voter name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Voter name cannot exceed 50 characters' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  voterName?: string;

  @IsArray({ message: 'Selected time slots must be an array' })
  @ArrayNotEmpty({ message: 'You must select at least one time slot' })
  @ArrayMaxSize(20, { message: 'Maximum 20 time slots can be selected' })
  @IsString({ each: true, message: 'Each time slot must be a string' })
  selectedTimeSlots!: string[];
}
