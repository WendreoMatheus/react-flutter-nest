// CHALLENGE — Flutter · post.dart
// Fill in the TODOs and fix the BUGs.

import 'package:equatable/equatable.dart';

class Post extends Equatable {
  final String id;
  final String title;
  final String description;
  final int votes;

  const Post({
    required this.id,
    required this.title,
    required this.description,
    required this.votes,
  });

  // Already implemented — parses a JSON map coming from the NestJS backend.
  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      votes: json['votes'] as int,
    );
  }

  // TODO [1]: Implement `copyWith`.
  //
  // Requirements:
  //  - Every parameter is OPTIONAL (nullable). If the caller does not pass
  //    a value for a field, the new Post must keep the current value for
  //    that field.
  //  - Use the `??` operator to fall back to `this.<field>` when the
  //    argument is null. Example for `title`: `title: title ?? this.title`.
  //  - Return a brand new `Post` instance — Post is immutable, do NOT
  //    mutate `this`.
  //
  // This method is used by PostCubit to produce an updated state when a
  // user votes (the cubit calls `post.copyWith(votes: post.votes + 1)`
  // as part of its optimistic update).
  Post copyWith({
    String? id,
    String? title,
    String? description,
    int? votes,
  }) {
    // TODO [1]: implement me
    throw UnimplementedError('Post.copyWith');
  }

  @override
  List<Object?> get props => [id, title, description, votes];
}
