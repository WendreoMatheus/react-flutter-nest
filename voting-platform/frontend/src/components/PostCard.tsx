import { Post } from '../types/post';

interface PostCardProps {
  post: Post;
  onVote?: (id: string) => void;
}

export function PostCard({ post, onVote }: PostCardProps): JSX.Element {
  return (
    <article
      style={{
        border: '1px solid #d0d7de',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{post.title}</h3>
        <p style={{ margin: 0, color: '#57606a' }}>{post.description}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>{post.votes}</div>
        <button
          type="button"
          onClick={() => onVote?.(post.id)}
          style={{
            marginTop: 8,
            padding: '6px 12px',
            border: '1px solid #d0d7de',
            borderRadius: 6,
            background: '#f6f8fa',
            cursor: 'pointer',
          }}
        >
          Vote
        </button>
      </div>
    </article>
  );
}
