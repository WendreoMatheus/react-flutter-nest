/// CHALLENGE TESTS — Flutter · post_cubit_test.dart
///
/// Run:  flutter test test/cubit/post_cubit_test.dart
///
/// All tests FAIL before fixes. All tests PASS after fixes.

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:voting_platform_mobile/cubit/post_cubit.dart';
import 'package:voting_platform_mobile/models/post.dart';
import 'package:voting_platform_mobile/repository/post_repository.dart';

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

  group('BUG [1]', () => {
    test('PostLoaded.posts should not allow external mutation', () {
      final state = PostLoaded(posts);

      expect(
        () => (state.posts as List<Post>).add(
          const Post(id: 'x', title: 'x', description: 'x', votes: 0),
        ),
        throwsA(isA<UnsupportedError>()),
      );
    });
  });

  group('BUG [2]', () {
    blocTest<PostCubit, PostState>(
      'search should be case-insensitive (lowercase query)',
      build: () {
        when(() => mockRepository.fetchAll()).thenAnswer((_) async => posts);
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        await cubit.loadPosts();
        cubit.search('rust');
      },
      skip: 2,
      expect: () => [
        isA<PostLoaded>().having((s) => s.posts.length, 'filtered count', 1),
      ],
    );

    blocTest<PostCubit, PostState>(
      'search should be case-insensitive (uppercase query)',
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
        isA<PostLoaded>().having((s) => s.posts.length, 'filtered count', 1),
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
      skip: 2,
      expect: () => [
        isA<PostLoaded>().having((s) => s.posts.length, 'filtered', greaterThan(0)),
        isA<PostLoaded>().having((s) => s.posts.length, 'all', 3),
      ],
    );
  });

  group('TODO [2]: vote', () {
    blocTest<PostCubit, PostState>(
      'should optimistically update the vote count',
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
      skip: 2,
      expect: () => [
        isA<PostLoaded>().having(
          (s) => s.posts.firstWhere((p) => p.id == 'p1').votes,
          'votes',
          43,
        ),
      ],
    );

    blocTest<PostCubit, PostState>(
      'should rollback when the API call fails',
      build: () {
        when(() => mockRepository.fetchAll()).thenAnswer((_) async => posts);
        when(() => mockRepository.vote('p1')).thenThrow(Exception('fail'));
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        await cubit.loadPosts();
        await cubit.vote('p1');
      },
      skip: 2,
      expect: () => [
        isA<PostLoaded>().having(
          (s) => s.posts.firstWhere((p) => p.id == 'p1').votes,
          'optimistic',
          43,
        ),
        isA<PostLoaded>().having(
          (s) => s.posts.firstWhere((p) => p.id == 'p1').votes,
          'rollback',
          42,
        ),
      ],
    );

    blocTest<PostCubit, PostState>(
      'should do nothing if posts are not loaded yet',
      build: () {
        return PostCubit(mockRepository);
      },
      act: (cubit) async {
        await cubit.vote('p1');
      },
      expect: () => <PostState>[],
    );
  });
}
