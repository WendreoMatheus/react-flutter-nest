// CHALLENGE — Flutter · post_cubit.dart
// Fix the BUGs and implement the TODOs. Run `flutter test` to check your progress.

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/post.dart';
import '../repository/post_repository.dart';

abstract class PostState extends Equatable {
  const PostState();

  @override
  List<Object?> get props => [];
}

class PostInitial extends PostState {
  const PostInitial();
}

class PostLoading extends PostState {
  const PostLoading();
}

class PostError extends PostState {
  final String message;
  const PostError(this.message);

  @override
  List<Object?> get props => [message];
}

// BUG [1]: There is a state immutability problem in this class.
class PostLoaded extends PostState {
  final List<Post> posts;
  const PostLoaded(this.posts);

  @override
  List<Object?> get props => [posts];
}

class PostCubit extends Cubit<PostState> {
  PostCubit(this._repository) : super(const PostInitial());

  final PostRepository _repository;
  List<Post> _allPosts = const <Post>[];

  Future<void> loadPosts() async {
    emit(const PostLoading());
    try {
      final posts = await _repository.fetchAll();
      _allPosts = posts;
      emit(PostLoaded(posts));
    } catch (e) {
      emit(PostError(e.toString()));
    }
  }

  // BUG [2]: The search filter has a case sensitivity problem.
  void search(String query) {
    if (_allPosts.isEmpty) return;
    if (query.isEmpty) {
      emit(PostLoaded(_allPosts));
      return;
    }
    final filtered = _allPosts.where((p) => p.title.contains(query)).toList();
    emit(PostLoaded(filtered));
  }

  // TODO [2]: Implement optimistic vote with rollback on error.
  Future<void> vote(String postId) async {
    throw UnimplementedError('PostCubit.vote');
  }
}
