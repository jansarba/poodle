import {
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePollDto {
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title!: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  imageUrl?: string;

  @IsArray({ message: 'Time slots must be an array' })
  @ArrayMinSize(1, { message: 'At least one time slot is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 time slots allowed' })
  @IsDateString(
    {},
    { each: true, message: 'Each time slot must be a valid date string' },
  )
  timeSlots!: string[];
}
