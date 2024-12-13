import { IsString, IsNumberString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  currentPosition?: string;

  @IsString()
  currentTeam?: string;

  @IsString()
  profilePicture?: string;

  @IsNumberString()
  yearsOfExperience?: number;

  @IsString()
  previousClubs?: string;

  @IsString()
  achievements?: string;
}
