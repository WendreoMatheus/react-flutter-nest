/// CHALLENGE TESTS — Flutter · post_cubit_test.dart
///
/// These tests validate the expected behaviour of PostCubit once every
/// BUG is fixed and every TODO is implemented.
///
/// Run:  flutter test test/cubit/post_cubit_test.dart
///
/// Status BEFORE fixing the challenge file:
///   - BUG-related tests  → FAIL
///   - TODO-related tests → FAIL
///
/// Status AFTER fixing the challenge file:
///   - All tests → PASS ✅

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:voting_platform_mobile/cubit/post_cubit.dart';
import 'package:voting_platform_mobile/models/post.dart';
import 'package:voting_platform_mobile/repository/post_repository.dart';

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------
class MockPostRepository extends Mock implements PostRepository {}

void main() {
  late MockPostRepository mockRepository;

  const posts = [
    Post(id: 'p1', title: 'Rust should be the default', description: 'Memory safety', votes: 42),
    Post(id: 'p2', title: 'Tailwind is inline styles', description: 'Hot take', votes: 17),
    Post(id: 'p3', title: 'SQLite in production', description: 'Underrated', votes: 55),
  ];

  setUp(() {
    mockRepository = MockPostRepository();
  });

  // =========================================================================
  // loadPosts — already implemented (should work as-is)
  // =========================================================================
  group('loadPosts', () {
    blocTest<PostCubit, PostState>(
      'emits [PostLoading, PostLoaded] on success',
      build: () {
        when(() => mockRepository.fetchAll()).thenAnswer((_) async => posts);
        return PostCubit(mockRepository);
      },
      act: (cubit) => cubit.loadPosts(),
      expect: () => [
        isA<PostLoading>(),
        isA<PostLoaded>().having((s) => s.posts.length, 'posts count', 3),
      ],
    );

    blocTest<PostCubit, PostState>(
      'emits [PostLoading, PostError] on failure',
      build: () {
        when(() => mockRepository.fetchAll()).thenThrow(Exception('network'));
        return PostCubit(mockRepository);
      },
      act: (cubit) => cubit.loadPosts(),
      expect: () => [
        isA<PostLoading>(),
        isA<PostError>(),
      ],
    );
  });

  // =========================================================================
  // FIX BUG [1] — PostLoaded.posts must be immutable (List.unmodifiable)
  // =========================================================================
  group('BUG [1]: PostLoaded immutability', () => {
    test('PostLoaded.posts should be unmodifiable', () {
      final state = PostLoaded(posts);

      expect(
        () => (state.posts as List<Post>).add(
          const Post(id: 'x', title: 'x', description: 'x', votes: 0),
        ),
        throwsA(isA<UnsupportedError>()),
        reason: 'PostLoaded.posts must be wrapped with List.unmodifiable '
            'so that external code cannot mutate emitted state.',
      );
    });
  });

  // =========================================================================
  // FIX BUG [2] — search must be case-insensitive
  // =========================================================================
  group('BUG [2]: search — case insensitive', () {
    blocTest<PostCubit, PostState>(
      'searching "rust" (lowercase) should find "Rust should be the default"',
      build: () {
        when(() => mockRepository.fetchAll()).thenAnswer((_) async => posts);
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        await cubit.loadPosts();
        cubit.search('rust');
      },
      skip: 2, // skip PostLoading + PostLoaded from loadPosts
      expect: () => [
        isA<PostLoaded>().having(
          (s) => s.posts.length,
          'filtered count',
          1,
        ),
      ],
    );

    blocTest<PostCubit, PostState>(
      'searching "SQLITE" (uppercase) should find "SQLite in production"',
      build: () {
        when(() => mockRepository.fetchAll()).thenAnswer((_) async => posts);
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        await cubit.loadPosts();
        cubit.search('SQLITE');
      },
      skip: 2,
      expect: () => [
        isA<PostLoaded>().having(
          (s) => s.posts.length,
          'filtered count',
          1,
        ),
      ],
    );

    blocTest<PostCubit, PostState>(
      'empty query should return all posts',
      build: () {
        when(() => mockRepository.fetchAll()).thenAnswer((_) async => posts);
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        await cubit.loadPosts();
        cubit.search('rust');
        cubit.search('');
      },
      skip: 2, // skip PostLoading + PostLoaded from loadPosts
      expect: () => [
        isA<PostLoaded>().having((s) => s.posts.length, 'filtered', greaterThan(0)),
        isA<PostLoaded>().having((s) => s.posts.length, 'all', 3),
      ],
    );
  });

  // =========================================================================
  // TODO [2] — vote(postId) — optimistic update + rollback
  // =========================================================================
  group('TODO [2]: vote — optimistic update', () {
    blocTest<PostCubit, PostState>(
      'should optimistically increment the vote count for the given post',
      build: () {
        when(() => mockRepository.fetchAll()).thenAnswer((_) async => posts);
        when(() => mockRepository.vote('p1')).thenAnswer(
          (_) async => posts[0].copyWith(votes: 43),
        );
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        await cubit.loadPosts();
        await cubit.vote('p1');
      },
      skip: 2, // skip PostLoading + PostLoaded from loadPosts
      expect: () => [
        isA<PostLoaded>().having(
          (s) => s.posts.firstWhere((p) => p.id == 'p1').votes,
          'optimistic votes',
          43,
        ),
      ],
    );

    blocTest<PostCubit, PostState>(
      'should rollback to the previous state when the API call fails',
      build: () {
        when(() => mockRepository.fetchAll()).thenAnswer((_) async => posts);
        when(() => mockRepository.vote('p1')).thenThrow(Exception('fail'));
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        await cubit.loadPosts();
        await cubit.vote('p1');
      },
      skip: 2, // skip PostLoading + PostLoaded from loadPosts
      expect: () => [
        // First: optimistic update (votes = 43)
        isA<PostLoaded>().having(
          (s) => s.posts.firstWhere((p) => p.id == 'p1').votes,
          'optimistic',
          43,
        ),
        // Second: rollback (votes = 42)
        isA<PostLoaded>().having(
          (s) => s.posts.firstWhere((p) => p.id == 'p1').votes,
          'rollback',
          42,
        ),
      ],
    );

    blocTest<PostCubit, PostState>(
      'should do nothing if the current state is not PostLoaded',
      build: () {
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        // State is PostInitial — vote should be a no-op
        await cubit.vote('p1');
      },
      expect: () => <PostState>[],
    );
  });
}
