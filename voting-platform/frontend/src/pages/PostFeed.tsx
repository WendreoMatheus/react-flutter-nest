// CHALLENGE — React · PostFeed.tsx
// Fix the BUGs and implement the TODOs. Run `npm test` to check your progress.

import { useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import { PostCard } from '../components/PostCard';
import { usePosts } from '../hooks/usePosts';
import { Post } from '../types/post';

export function PostFeed(): JSX.Element {
  const { posts, setPosts, loading, error } = usePosts();
  const [search, setSearch] = useState<string>('');

  const filteredPosts = useMemo<Post[]>(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle),
    );
  }, [posts, search]);

  // TODO [1]: Implement optimistic vote with rollback on error.
  async function handleVote(id: string): Promise<void> {
    console.warn('handleVote not implemented', id);
  }

  // TODO [2]: Add a 300ms debounce to this function. No external libraries allowed.
  function handleSearch(value: string): void {
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

      {/* BUG [1]: The list key strategy is wrong. */}
      {/* BUG [2]: The vote button does not work. */}
      {filteredPosts.map((post, index) => (
        <PostCard key={index} post={post} />
      ))}
    </main>
  );
}
