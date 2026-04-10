import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Post } from '../types/post';

interface UsePostsResult {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  loading: boolean;
  error: string | null;
}

export function usePosts(): UsePostsResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get<Post[]>('/posts')
      .then((res) => {
        if (!cancelled) {
          setPosts(res.data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { posts, setPosts, loading, error };
}
