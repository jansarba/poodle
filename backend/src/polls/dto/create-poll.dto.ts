import { IsString, MinLength, IsArray, ArrayMinSize } from 'class-validator';

export class CreatePollDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  timeSlots!: string[];
}
