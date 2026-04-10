/**
 * CHALLENGE TESTS — NestJS · posts.service.spec.ts
 *
 * These tests validate the expected behaviour of PostsService once every
 * BUG is fixed and every TODO is implemented.
 *
 * Run:  npm test
 *
 * Status BEFORE fixing the challenge file:
 *   - BUG-related tests  → FAIL (wrong behaviour)
 *   - TODO-related tests → FAIL (throws "Not implemented")
 *
 * Status AFTER fixing the challenge file:
 *   - All tests → PASS ✅
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------
const mockPrismaService = {
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  vote: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  // =========================================================================
  // FIX BUG [1] — PrismaService must be injected via constructor
  // =========================================================================
  describe('BUG [1]: PrismaService injection', () => {
    it('should use the injected PrismaService, not a raw PrismaClient', async () => {
      const posts = [{ id: '1', title: 'Hello', description: 'World', votes: 5, createdAt: new Date() }];
      mockPrismaService.post.findMany.mockResolvedValue(posts);

      const result = await service.findAll();

      // If the service still uses `new PrismaClient()` internally, our mock
      // will never be called and `result` won't match.
      expect(mockPrismaService.post.findMany).toHaveBeenCalled();
      expect(result).toEqual(posts);
    });
  });

  // =========================================================================
  // FIX BUG [2] — findOne must throw NotFoundException (not plain Error)
  // =========================================================================
  describe('BUG [2]: findOne — NotFoundException', () => {
    it('should return the post when it exists', async () => {
      const post = { id: '1', title: 'A', description: 'B', votes: 0, createdAt: new Date() };
      mockPrismaService.post.findUnique.mockResolvedValue(post);

      const result = await service.findOne('1');
      expect(result).toEqual(post);
    });

    it('should throw NotFoundException when the post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('should NOT throw a generic Error for missing posts', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      try {
        await service.findOne('missing');
        fail('Expected an exception to be thrown');
      } catch (err) {
        // Must be a NestJS NotFoundException, not a plain Error
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err).not.toStrictEqual(expect.objectContaining({ response: undefined }));
      }
    });
  });

  // =========================================================================
  // FIX BUG [3] — getTopPosts must use Prisma orderBy + take
  // =========================================================================
  describe('BUG [3]: getTopPosts — database-level ordering', () => {
    it('should call findMany with orderBy + take instead of fetching everything', async () => {
      const top = [{ id: '1', title: 'Top', description: 'D', votes: 99, createdAt: new Date() }];
      mockPrismaService.post.findMany.mockResolvedValue(top);

      const result = await service.getTopPosts();

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { votes: 'desc' },
          take: 10,
        }),
      );
      expect(result).toEqual(top);
    });
  });

  // =========================================================================
  // TODO [1] — create(data)
  // =========================================================================
  describe('TODO [1]: create', () => {
    it('should create a post with votes initialized to 0', async () => {
      const created = { id: 'new-1', title: 'My Post', description: 'Content', votes: 0, createdAt: new Date() };
      mockPrismaService.post.create.mockResolvedValue(created);

      const result = await service.create({ title: 'My Post', description: 'Content' });

      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'My Post',
            description: 'Content',
            votes: 0,
          }),
        }),
      );
      expect(result).toEqual(created);
    });

    it('should throw BadRequestException when title is empty', async () => {
      await expect(service.create({ title: '', description: 'Something' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when description is empty', async () => {
      await expect(service.create({ title: 'Title', description: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when title is only whitespace', async () => {
      await expect(service.create({ title: '   ', description: 'Content' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // TODO [2] — vote(postId, userId)
  // =========================================================================
  describe('TODO [2]: vote', () => {
    const postId = 'post-1';
    const userId = 'user-1';

    it('should increment votes atomically and return the updated post', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue(null);

      const updatedPost = { id: postId, title: 'A', description: 'B', votes: 6, createdAt: new Date() };
      mockPrismaService.$transaction.mockResolvedValue([updatedPost, {}]);

      const result = await service.vote(postId, userId);

      // Must use $transaction
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedPost);
    });

    it('should throw ConflictException when the user has already voted', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        userId,
        postId,
        createdAt: new Date(),
      });

      await expect(service.vote(postId, userId)).rejects.toThrow(ConflictException);
    });

    it('should check for existing vote using the composite unique key', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue(null);
      const updatedPost = { id: postId, title: 'A', description: 'B', votes: 1, createdAt: new Date() };
      mockPrismaService.$transaction.mockResolvedValue([updatedPost, {}]);

      await service.vote(postId, userId);

      expect(mockPrismaService.vote.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_postId: { userId, postId } },
        }),
      );
    });
  });
});
