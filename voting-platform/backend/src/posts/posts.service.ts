// CHALLENGE — NestJS · posts.service.ts
// Fill in the TODOs and fix the BUGs.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, PostResponseDto } from './posts.dto';

@Injectable()
export class PostsService {
  // BUG [1]: PrismaClient is being instantiated directly here instead of
  // injecting PrismaService via the constructor. This bypasses Nest's
  // dependency injection, creates a second connection pool on every request
  // this service is used, and makes the service impossible to test with
  // mocks. It also means PrismaService.onModuleInit / onModuleDestroy never
  // run for this instance so the connection lifecycle is not managed.
  //
  // Expected fix: remove this field and inject PrismaService via the
  // constructor, e.g. `constructor(private readonly prisma: PrismaService) {}`
  private readonly prisma = new (require('@prisma/client').PrismaClient)();

  // Already implemented — returns every post ordered by votes desc.
  async findAll(): Promise<PostResponseDto[]> {
    return this.prisma.post.findMany({
      orderBy: { votes: 'desc' },
    });
  }

  // Already implemented (with a bug) — finds a post by id.
  async findOne(id: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      // BUG [2]: Throwing a plain `Error` here surfaces to the client as a
      // generic 500 Internal Server Error. Nest has a dedicated
      // `NotFoundException` (already imported above) that maps to a proper
      // HTTP 404 with a structured JSON body. Use it here so the frontend
      // can distinguish "post missing" from "server exploded".
      throw new Error('Post not found');
    }

    return post;
  }

  // BUG [3]: This implementation pulls *every* row into memory, then sorts
  // and slices in JavaScript. On a table with hundreds of thousands of posts
  // this is catastrophic — memory blows up and the query is O(n log n)
  // client-side instead of using the database index. Prisma supports
  // `orderBy` and `take`, push the work down to the database:
  //
  //   return this.prisma.post.findMany({
  //     orderBy: { votes: 'desc' },
  //     take: 10,
  //   });
  async getTopPosts(): Promise<PostResponseDto[]> {
    const all = await this.prisma.post.findMany();
    const sorted = all.sort(
      (a: PostResponseDto, b: PostResponseDto) => b.votes - a.votes,
    );
    return sorted.slice(0, 10);
  }

  // TODO [1]: Implement `create`.
  //
  // Requirements:
  //  - Validate that `data.title` and `data.description` are non-empty
  //    strings. If either is missing or blank, throw a `BadRequestException`
  //    (import it from '@nestjs/common').
  //  - Initialize `votes` to 0 on the new record — do not trust the client
  //    to send it.
  //  - Persist with `this.prisma.post.create(...)` and return the created
  //    post so the controller can send it back to the caller.
  async create(data: CreatePostDto): Promise<PostResponseDto> {
    // TODO [1]: implement me
    throw new Error('Not implemented');
  }

  // TODO [2]: Implement `vote`.
  //
  // Requirements:
  //  - A user can only vote once for a given post. The `Vote` model has a
  //    composite unique index on `(userId, postId)` — use `findUnique` with
  //    `where: { userId_postId: { userId, postId } }` to check whether a
  //    vote already exists. If it does, throw a `ConflictException`
  //    (import it from '@nestjs/common').
  //  - The post's `votes` counter must be incremented atomically. Do NOT
  //    read the current value and write `votes + 1` — use Prisma's
  //    `{ votes: { increment: 1 } }` syntax so concurrent votes don't race.
  //  - Creating the Vote row and incrementing the counter MUST happen in a
  //    single `this.prisma.$transaction([...])` call. If either fails,
  //    neither should be persisted.
  //  - Return the updated post (the result of the update call) so the
  //    controller can return it to the client with the new vote count.
  async vote(postId: string, userId: string): Promise<PostResponseDto> {
    // TODO [2]: implement me
    throw new Error('Not implemented');
  }
}
