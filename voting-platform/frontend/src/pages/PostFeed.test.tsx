/**
 * CHALLENGE TESTS — React · PostFeed.test.tsx
 *
 * Run:  npm test
 *
 * All tests FAIL before fixes. All tests PASS after fixes. ✅
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSetPosts = vi.fn();
const mockApiPost = vi.fn();

const SAMPLE_POSTS = [
  { id: 'p1', title: 'First Post', description: 'Description one', votes: 10, createdAt: '2024-01-01' },
  { id: 'p2', title: 'Second Post', description: 'Description two', votes: 5, createdAt: '2024-01-02' },
  { id: 'p3', title: 'Third Post', description: 'Something else', votes: 20, createdAt: '2024-01-03' },
];

vi.mock('../hooks/usePosts', () => ({
  usePosts: () => ({
    posts: SAMPLE_POSTS,
    setPosts: mockSetPosts,
    loading: false,
    error: null,
  }),
}));

vi.mock('../api/client', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

import { PostFeed } from './PostFeed';

describe('PostFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSetPosts.mockReset();
    mockApiPost.mockReset();
    mockApiPost.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('BUG [1]', () => {
    it('should render all posts correctly', () => {
      const { container } = render(<PostFeed />);
      const cards = container.querySelectorAll('article');
      expect(cards).toHaveLength(3);
    });
  });

  describe('BUG [2]', () => {
    it('should trigger a vote when the button is clicked', async () => {
      render(<PostFeed />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });
      expect(voteButtons.length).toBeGreaterThanOrEqual(1);

      await act(async () => {
        fireEvent.click(voteButtons[0]);
      });

      expect(mockSetPosts).toHaveBeenCalled();
      expect(mockApiPost).toHaveBeenCalledWith('/posts/p1/vote');
    });
  });

  describe('TODO [1]: handleVote', () => {
    it('should optimistically update the vote count', async () => {
      render(<PostFeed />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });

      await act(async () => {
        fireEvent.click(voteButtons[0]);
      });

      expect(mockSetPosts).toHaveBeenCalled();

      const updater = mockSetPosts.mock.calls[0][0];
      const updated = typeof updater === 'function' ? updater(SAMPLE_POSTS) : updater;
      const targetPost = updated.find((p: { id: string }) => p.id === 'p1');
      expect(targetPost.votes).toBe(11);
    });

    it('should call the API to persist the vote', async () => {
      render(<PostFeed />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });

      await act(async () => {
        fireEvent.click(voteButtons[0]);
      });

      expect(mockApiPost).toHaveBeenCalledWith('/posts/p1/vote');
    });

    it('should rollback when the API call fails', async () => {
      mockApiPost.mockRejectedValueOnce(new Error('Network error'));

      render(<PostFeed />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });

      await act(async () => {
        fireEvent.click(voteButtons[0]);
      });

      await waitFor(() => {
        expect(mockSetPosts).toHaveBeenCalledTimes(2);
      });

      const rollbackValue = mockSetPosts.mock.calls[1][0];
      const rolled = typeof rollbackValue === 'function' ? rollbackValue(SAMPLE_POSTS) : rollbackValue;
      const rolledPost = Array.isArray(rolled)
        ? rolled.find((p: { id: string }) => p.id === 'p1')
        : SAMPLE_POSTS.find((p) => p.id === 'p1');
      expect(rolledPost?.votes ?? SAMPLE_POSTS[0].votes).toBe(10);
    });
  });

  describe('TODO [2]: handleSearch', () => {
    it('should render a search input', () => {
      render(<PostFeed />);
      const input = screen.getByPlaceholderText(/search/i);
      expect(input).toBeInTheDocument();
    });

    it('should not apply the filter immediately', async () => {
      render(<PostFeed />);

      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'First' } });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getAllByRole('article').length).toBe(3);
    });

    it('should apply the filter after the debounce period', async () => {
      render(<PostFeed />);

      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'First' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
        expect(screen.queryByText('Third Post')).not.toBeInTheDocument();
      });
    });

    it('should reset the timer on rapid input', async () => {
      render(<PostFeed />);

      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'Fi' } });
      act(() => {
        vi.advanceTimersByTime(150);
      });
      fireEvent.change(input, { target: { value: 'Third' } });
      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(screen.getByText('Third Post')).toBeInTheDocument();
        expect(screen.queryByText('First Post')).not.toBeInTheDocument();
      });
    });
  });
});
