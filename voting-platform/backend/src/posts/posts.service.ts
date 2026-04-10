// CHALLENGE — NestJS · posts.service.ts
// Fix the BUGs and implement the TODOs. Run `npm test` to check your progress.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, PostResponseDto } from './posts.dto';

@Injectable()
export class PostsService {
  // BUG [1]: There is a dependency injection problem in this service.
  private readonly prisma = new (require('@prisma/client').PrismaClient)();

  async findAll(): Promise<PostResponseDto[]> {
    return this.prisma.post.findMany({
      orderBy: { votes: 'desc' },
    });
  }

  // BUG [2]: This method does not return the correct HTTP status when the post is missing.
  async findOne(id: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  }

  // BUG [3]: This method has a performance problem at scale.
  async getTopPosts(): Promise<PostResponseDto[]> {
    const all = await this.prisma.post.findMany();
    const sorted = all.sort(
      (a: PostResponseDto, b: PostResponseDto) => b.votes - a.votes,
    );
    return sorted.slice(0, 10);
  }

  // TODO [1]: Implement post creation with input validation.
  async create(data: CreatePostDto): Promise<PostResponseDto> {
    throw new Error('Not implemented');
  }

  // TODO [2]: Implement voting. A user can only vote once per post.
  // The vote count must be updated atomically.
  async vote(postId: string, userId: string): Promise<PostResponseDto> {
    throw new Error('Not implemented');
  }
}
