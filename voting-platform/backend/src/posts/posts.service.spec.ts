/**
 * CHALLENGE TESTS — NestJS · posts.service.spec.ts
 *
 * Run:  npm test
 *
 * All tests FAIL before fixes. All tests PASS after fixes. ✅
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';

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

  describe('BUG [1]', () => {
    it('should use the injected dependency for database access', async () => {
      const posts = [{ id: '1', title: 'Hello', description: 'World', votes: 5, createdAt: new Date() }];
      mockPrismaService.post.findMany.mockResolvedValue(posts);

      const result = await service.findAll();

      expect(mockPrismaService.post.findMany).toHaveBeenCalled();
      expect(result).toEqual(posts);
    });
  });

  describe('BUG [2]', () => {
    it('should return the post when it exists', async () => {
      const post = { id: '1', title: 'A', description: 'B', votes: 0, createdAt: new Date() };
      mockPrismaService.post.findUnique.mockResolvedValue(post);

      const result = await service.findOne('1');
      expect(result).toEqual(post);
    });

    it('should return the correct HTTP error when the post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('should not return a generic 500 error for missing posts', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      try {
        await service.findOne('missing');
        fail('Expected an exception to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('BUG [3]', () => {
    it('should delegate ordering and limiting to the database', async () => {
      const top = [{ id: '1', title: 'Top', description: 'D', votes: 99, createdAt: new Date() }];
      mockPrismaService.post.findMany.mockResolvedValue(top);

      const result = await service.getTopPosts();

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.any(Object),
          take: expect.any(Number),
        }),
      );
      expect(result).toEqual(top);
    });
  });

  describe('TODO [1]: create', () => {
    it('should persist a new post with votes starting at zero', async () => {
      const created = { id: 'new-1', title: 'My Post', description: 'Content', votes: 0, createdAt: new Date() };
      mockPrismaService.post.create.mockResolvedValue(created);

      const result = await service.create({ title: 'My Post', description: 'Content' });

      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ votes: 0 }),
        }),
      );
      expect(result).toEqual(created);
    });

    it('should reject an empty title', async () => {
      await expect(service.create({ title: '', description: 'Something' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject an empty description', async () => {
      await expect(service.create({ title: 'Title', description: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject a whitespace-only title', async () => {
      await expect(service.create({ title: '   ', description: 'Content' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('TODO [2]: vote', () => {
    const postId = 'post-1';
    const userId = 'user-1';

    it('should update the vote count and return the updated post', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue(null);

      const updatedPost = { id: postId, title: 'A', description: 'B', votes: 6, createdAt: new Date() };
      mockPrismaService.$transaction.mockResolvedValue([updatedPost, {}]);

      const result = await service.vote(postId, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedPost);
    });

    it('should reject a duplicate vote from the same user', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        userId,
        postId,
        createdAt: new Date(),
      });

      await expect(service.vote(postId, userId)).rejects.toThrow(ConflictException);
    });

    it('should check for an existing vote before proceeding', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue(null);
      const updatedPost = { id: postId, title: 'A', description: 'B', votes: 1, createdAt: new Date() };
      mockPrismaService.$transaction.mockResolvedValue([updatedPost, {}]);

      await service.vote(postId, userId);

      expect(mockPrismaService.vote.findUnique).toHaveBeenCalled();
    });
  });
});
