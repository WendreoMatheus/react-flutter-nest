// CHALLENGE — Flutter · post_cubit.dart
// Fill in the TODOs and fix the BUGs.

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

class PostLoaded extends PostState {
  // BUG [1]: `posts` is assigned directly from the constructor parameter,
  // which means the cubit (or any caller) could mutate the list after it
  // has been emitted. State emitted by a cubit MUST be immutable — if the
  // underlying list is mutated in place, Bloc's state comparison may miss
  // the change and widgets will not rebuild.
  //
  // Expected fix: wrap `posts` with `List.unmodifiable(posts)` inside the
  // constructor body so external mutation is impossible. Note that this
  // requires dropping the `const` qualifier on the constructor.
  final List<Post> posts;
  const PostLoaded(this.posts);

  @override
  List<Object?> get props => [posts];
}

class PostCubit extends Cubit<PostState> {
  PostCubit(this._repository) : super(const PostInitial());

  final PostRepository _repository;
  List<Post> _allPosts = const <Post>[];

  // Already implemented — fetches posts and emits Loaded / Error.
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

  // Already implemented (with a bug) — filters the loaded list by title.
  void search(String query) {
    if (_allPosts.isEmpty) return;
    if (query.isEmpty) {
      emit(PostLoaded(_allPosts));
      return;
    }
    // BUG [2]: `String.contains` on the raw title + query is
    // case-sensitive. Searching for "rust" will not match a post titled
    // "Rust should be the default for new CLIs". Lower-case both sides
    // before comparing:
    //
    //   final needle = query.toLowerCase();
    //   final filtered = _allPosts
    //       .where((p) => p.title.toLowerCase().contains(needle))
    //       .toList();
    final filtered = _allPosts.where((p) => p.title.contains(query)).toList();
    emit(PostLoaded(filtered));
  }

  // TODO [2]: Implement `vote(String postId)`.
  //
  // Requirements (optimistic update + rollback on error):
  //  1. Guard: if the current state is NOT `PostLoaded`, return early.
  //     There is nothing to update if we haven't loaded any posts yet.
  //  2. Capture the current state into a local `previous` variable. You
  //     will re-emit it if the network call fails.
  //  3. Build a new list of posts where the post with the matching
  //     `postId` has its votes incremented by 1. Use the `copyWith` you
  //     implemented in `Post` (TODO [1] in post.dart) to produce the new
  //     Post — do NOT mutate the existing Post instance.
  //  4. Emit `PostLoaded(newList)` to update the UI optimistically.
  //  5. Call `await _repository.vote(postId)` to tell the backend. If it
  //     throws, emit `previous` to roll back the optimistic update.
  //
  // Do not reload the full list on success — the optimistic state is
  // correct and the backend has already been updated.
  Future<void> vote(String postId) async {
    // TODO [2]: implement me
    throw UnimplementedError('PostCubit.vote');
  }
}
