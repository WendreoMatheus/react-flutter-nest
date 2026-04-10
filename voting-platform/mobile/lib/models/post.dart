// CHALLENGE — Flutter · post.dart
// Fix the BUGs and implement the TODOs. Run `flutter test` to check your progress.

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

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      votes: json['votes'] as int,
    );
  }

  // TODO [1]: Implement copyWith.
  Post copyWith({
    String? id,
    String? title,
    String? description,
    int? votes,
  }) {
    throw UnimplementedError('Post.copyWith');
  }

  @override
  List<Object?> get props => [id, title, description, votes];
}
