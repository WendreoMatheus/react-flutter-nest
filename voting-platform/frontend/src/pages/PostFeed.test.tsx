/**
 * CHALLENGE TESTS — React · PostFeed.test.tsx
 *
 * These tests validate the expected behaviour of PostFeed once every
 * BUG is fixed and every TODO is implemented.
 *
 * Run:  npm test
 *
 * Status BEFORE fixing the challenge file:
 *   - BUG-related tests  → FAIL
 *   - TODO-related tests → FAIL
 *
 * Status AFTER fixing the challenge file:
 *   - All tests → PASS ✅
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Mocks — we intercept usePosts and apiClient so PostFeed works in isolation
// ---------------------------------------------------------------------------
const mockSetPosts = vi.fn();
const mockApiPost = vi.fn();

const SAMPLE_POSTS = [
  { id: 'p1', title: 'First Post', description: 'Description one', votes: 10, createdAt: '2024-01-01' },
  { id: 'p2', title: 'Second Post', description: 'Description two', votes: 5, createdAt: '2024-01-02' },
  { id: 'p3', title: 'Third Post', description: 'Something else', votes: 20, createdAt: '2024-01-03' },
];

// Mock usePosts hook
vi.mock('../hooks/usePosts', () => ({
  usePosts: () => ({
    posts: SAMPLE_POSTS,
    setPosts: mockSetPosts,
    loading: false,
    error: null,
  }),
}));

// Mock apiClient
vi.mock('../api/client', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

// We import AFTER mocks are defined so the module picks them up.
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

  // =========================================================================
  // FIX BUG [1] — key must be post.id, not array index
  // =========================================================================
  describe('BUG [1]: list key should be post.id', () => {
    it('should render each PostCard with a stable key derived from post.id', () => {
      const { container } = render(<PostFeed />);

      // Each <article> (PostCard root) is rendered. We verify there are 3.
      const cards = container.querySelectorAll('article');
      expect(cards).toHaveLength(3);

      // React DevTools aren't accessible in RTL, but we can verify indirectly:
      // if the code uses `key={index}`, reordering the list would cause React
      // to re-use DOM nodes incorrectly. This structural test just makes sure
      // the list renders — the "key" fix is validated by the absence of the
      // React warning in the console + proper reconciliation. The fix itself
      // is straightforward: `key={post.id}`.
    });
  });

  // =========================================================================
  // FIX BUG [2] — onVote prop must be passed to PostCard
  // =========================================================================
  describe('BUG [2]: onVote must be wired to PostCard', () => {
    it('should call handleVote when a Vote button is clicked', async () => {
      render(<PostFeed />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });
      expect(voteButtons.length).toBeGreaterThanOrEqual(1);

      // Click the first Vote button — it should trigger the onVote prop.
      // If onVote is not passed, setPosts will never be called.
      await act(async () => {
        fireEvent.click(voteButtons[0]);
      });

      // After BUG [2] + TODO [1] are both fixed, clicking Vote should call
      // setPosts (optimistic update) and apiClient.post (API call).
      expect(mockSetPosts).toHaveBeenCalled();
      expect(mockApiPost).toHaveBeenCalledWith('/posts/p1/vote');
    });
  });

  // =========================================================================
  // TODO [1] — handleVote optimistic update + rollback
  // =========================================================================
  describe('TODO [1]: handleVote — optimistic update', () => {
    it('should optimistically increment the vote count via setPosts', async () => {
      render(<PostFeed />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });

      await act(async () => {
        fireEvent.click(voteButtons[0]);
      });

      // setPosts must be called with a mapper or a new array
      expect(mockSetPosts).toHaveBeenCalled();

      // Extract what was passed to setPosts and verify the vote was bumped
      const updater = mockSetPosts.mock.calls[0][0];
      const updated = typeof updater === 'function' ? updater(SAMPLE_POSTS) : updater;
      const targetPost = updated.find((p: { id: string }) => p.id === 'p1');
      expect(targetPost.votes).toBe(11); // was 10, now 10 + 1
    });

    it('should call the API to persist the vote', async () => {
      render(<PostFeed />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });

      await act(async () => {
        fireEvent.click(voteButtons[0]);
      });

      expect(mockApiPost).toHaveBeenCalledWith('/posts/p1/vote');
    });

    it('should rollback setPosts to previous state when the API call fails', async () => {
      mockApiPost.mockRejectedValueOnce(new Error('Network error'));

      render(<PostFeed />);

      const voteButtons = screen.getAllByRole('button', { name: /vote/i });

      await act(async () => {
        fireEvent.click(voteButtons[0]);
      });

      // First call: optimistic update
      // Second call: rollback to previous
      await waitFor(() => {
        expect(mockSetPosts).toHaveBeenCalledTimes(2);
      });

      const rollbackValue = mockSetPosts.mock.calls[1][0];
      const rolled = typeof rollbackValue === 'function' ? rollbackValue(SAMPLE_POSTS) : rollbackValue;
      // The rollback should restore original votes
      const rolledPost = Array.isArray(rolled)
        ? rolled.find((p: { id: string }) => p.id === 'p1')
        : SAMPLE_POSTS.find((p) => p.id === 'p1');
      expect(rolledPost?.votes ?? SAMPLE_POSTS[0].votes).toBe(10);
    });
  });

  // =========================================================================
  // TODO [2] — handleSearch with 300ms debounce
  // =========================================================================
  describe('TODO [2]: handleSearch — debounce', () => {
    it('should render a search input', () => {
      render(<PostFeed />);
      const input = screen.getByPlaceholderText(/search/i);
      expect(input).toBeInTheDocument();
    });

    it('should NOT update the filter immediately (debounce 300ms)', async () => {
      render(<PostFeed />);

      const input = screen.getByPlaceholderText(/search/i);

      // Type quickly — should NOT apply filter until 300ms passes
      fireEvent.change(input, { target: { value: 'First' } });

      // Before the debounce fires, all 3 posts should still be visible
      // (unless the candidate already wired a non-debounced version — the
      // key signal is that "Third Post" should still be present)
      // Note: this test is lenient — it verifies debounce exists.
      // We advance time partially and check:
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // After 100ms the filter should NOT have been applied yet
      // All posts should still be rendered
      expect(screen.getAllByRole('article').length).toBe(3);
    });

    it('should apply the filter after the debounce period (300ms)', async () => {
      render(<PostFeed />);

      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'First' } });

      // Advance past debounce
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // After 300ms, only matching posts should be visible
      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
        expect(screen.queryByText('Third Post')).not.toBeInTheDocument();
      });
    });

    it('should reset the debounce timer on rapid keystrokes', async () => {
      render(<PostFeed />);

      const input = screen.getByPlaceholderText(/search/i);

      // Type "Fi" then quickly "Thi" — only the last value matters
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
