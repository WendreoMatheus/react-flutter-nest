// CHALLENGE — React · PostFeed.tsx
// Fill in the TODOs and fix the BUGs.

import { useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import { PostCard } from '../components/PostCard';
import { usePosts } from '../hooks/usePosts';
import { Post } from '../types/post';

export function PostFeed(): JSX.Element {
  const { posts, setPosts, loading, error } = usePosts();
  const [search, setSearch] = useState<string>('');

  // Already implemented — case-insensitive filter over title + description.
  const filteredPosts = useMemo<Post[]>(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle),
    );
  }, [posts, search]);

  // TODO [1]: Implement `handleVote(id)`.
  //
  // Requirements (optimistic update + rollback on error):
  //  1. Capture the current `posts` array into a local `previous` variable.
  //     You will use it to restore state if the API call fails.
  //  2. Immediately call `setPosts(...)` with a new array where the post
  //     whose id matches `id` has `votes + 1`. This is the optimistic
  //     update — the UI reflects the change before the network round-trip.
  //  3. Call `await apiClient.post(`/posts/${id}/vote`)` to tell the backend.
  //  4. If the call throws, call `setPosts(previous)` to roll back to the
  //     snapshot taken in step 1. Log or surface the error as you see fit.
  //
  // Do not refetch the whole list on success — the optimistic state is the
  // source of truth, and the backend has already been updated.
  async function handleVote(id: string): Promise<void> {
    // TODO [1]: implement me
    console.warn('handleVote not implemented', id);
  }

  // TODO [2]: Add a 300ms debounce to `handleSearch`.
  //
  // Requirements:
  //  - Do NOT use lodash, use-debounce, or any external library. Use only
  //    React primitives (`useRef`) and `setTimeout` / `clearTimeout`.
  //  - Create a ref that holds the current pending timer id
  //    (initialize it as `useRef<number | null>(null)` at the top of the
  //    component — you'll need to move this outside of `handleSearch`).
  //  - On every call: clear the existing timer (if any), then schedule a
  //    new `setTimeout` that calls `setSearch(value)` after 300ms.
  //  - Make sure back-to-back keystrokes only result in ONE `setSearch`
  //    call, 300ms after the last keystroke.
  function handleSearch(value: string): void {
    // TODO [2]: debounce this call — right now it updates on every keystroke.
    setSearch(value);
  }

  if (loading) {
    return <p style={{ padding: 24 }}>Loading posts…</p>;
  }

  if (error) {
    return (
      <p style={{ padding: 24, color: '#cf222e' }}>
        Failed to load posts: {error}
      </p>
    );
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 24,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <h1>Voting Platform</h1>

      <input
        type="search"
        placeholder="Search posts…"
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          marginBottom: 16,
          border: '1px solid #d0d7de',
          borderRadius: 6,
          fontSize: 14,
        }}
      />

      {filteredPosts.map((post, index) => (
        // BUG [1]: Using the array index as a key means React can't tell
        // posts apart when the list is reordered (for example, after a
        // vote bumps one to the top). It causes subtle bugs with input
        // state and animations. Use `post.id`, which is a stable
        // unique identifier from the backend.
        //
        // BUG [2]: The `onVote` prop is not passed to <PostCard />, so
        // the vote button inside each card has nothing to call. Wire it
        // up to `handleVote` (once you've implemented TODO [1]).
        <PostCard key={index} post={post} />
      ))}
    </main>
  );
}
