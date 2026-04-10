/// CHALLENGE TESTS — Flutter · post_test.dart
///
/// These tests validate the expected behaviour of Post.copyWith once
/// TODO [1] is implemented.
///
/// Run:  flutter test test/models/post_test.dart
///
/// Status BEFORE fixing the challenge file:
///   - All tests → FAIL (throws UnimplementedError)
///
/// Status AFTER fixing the challenge file:
///   - All tests → PASS ✅

import 'package:flutter_test/flutter_test.dart';
import 'package:voting_platform_mobile/models/post.dart';

void main() {
  const post = Post(
    id: 'p1',
    title: 'Original Title',
    description: 'Original Description',
    votes: 10,
  );

  group('Post.fromJson', () {
    test('should parse a JSON map correctly', () {
      final json = <String, dynamic>{
        'id': 'p1',
        'title': 'Title',
        'description': 'Desc',
        'votes': 5,
      };

      final parsed = Post.fromJson(json);

      expect(parsed.id, 'p1');
      expect(parsed.title, 'Title');
      expect(parsed.description, 'Desc');
      expect(parsed.votes, 5);
    });
  });

  group('TODO [1]: Post.copyWith', () {
    test('should return a new Post with updated votes', () {
      final updated = post.copyWith(votes: 11);

      expect(updated.votes, 11);
      expect(updated.id, post.id);
      expect(updated.title, post.title);
      expect(updated.description, post.description);
    });

    test('should return a new Post with updated title', () {
      final updated = post.copyWith(title: 'New Title');

      expect(updated.title, 'New Title');
      expect(updated.votes, post.votes);
      expect(updated.description, post.description);
    });

    test('should keep all fields unchanged when no arguments are passed', () {
      final copy = post.copyWith();

      expect(copy.id, post.id);
      expect(copy.title, post.title);
      expect(copy.description, post.description);
      expect(copy.votes, post.votes);
      expect(copy, equals(post));
    });

    test('should return a new instance, not the same reference', () {
      final copy = post.copyWith();

      expect(identical(copy, post), isFalse);
    });

    test('should allow updating multiple fields at once', () {
      final updated = post.copyWith(
        title: 'Changed',
        description: 'Also changed',
        votes: 99,
      );

      expect(updated.title, 'Changed');
      expect(updated.description, 'Also changed');
      expect(updated.votes, 99);
      expect(updated.id, post.id);
    });
  });

  group('Post — Equatable', () {
    test('two Posts with same fields should be equal', () {
      const a = Post(id: '1', title: 'T', description: 'D', votes: 0);
      const b = Post(id: '1', title: 'T', description: 'D', votes: 0);
      expect(a, equals(b));
    });

    test('two Posts with different votes should not be equal', () {
      const a = Post(id: '1', title: 'T', description: 'D', votes: 0);
      const b = Post(id: '1', title: 'T', description: 'D', votes: 1);
      expect(a, isNot(equals(b)));
    });
  });
}
