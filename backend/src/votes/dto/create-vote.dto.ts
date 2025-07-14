import { IsString, MinLength, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @MinLength(2, { message: 'Voter name must be at least 2 characters long' })
  voterName!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'You must select at least one time slot' })
  @IsString({ each: true })
  selectedTimeSlots!: string[];
}
