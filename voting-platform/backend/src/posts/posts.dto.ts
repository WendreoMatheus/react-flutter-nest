export class CreatePostDto {
  title!: string;
  description!: string;
}

export class PostResponseDto {
  id!: string;
  title!: string;
  description!: string;
  votes!: number;
  createdAt!: Date;
}
