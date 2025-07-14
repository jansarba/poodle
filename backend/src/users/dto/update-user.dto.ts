import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
