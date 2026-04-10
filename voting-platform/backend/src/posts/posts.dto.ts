import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class PostResponseDto {
  id!: string;
  title!: string;
  description!: string;
  votes!: number;
  createdAt!: Date;
}
