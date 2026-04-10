import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../cubit/post_cubit.dart';
import '../widgets/post_card.dart';

class PostListScreen extends StatelessWidget {
  const PostListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Voting Platform')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Search posts',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => context.read<PostCubit>().search(value),
            ),
          ),
          Expanded(
            child: BlocBuilder<PostCubit, PostState>(
              builder: (context, state) {
                if (state is PostLoading || state is PostInitial) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is PostError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Failed to load posts: ${state.message}',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                }
                if (state is PostLoaded) {
                  if (state.posts.isEmpty) {
                    return const Center(child: Text('No posts.'));
                  }
                  return ListView.builder(
                    itemCount: state.posts.length,
                    itemBuilder: (context, index) {
                      final post = state.posts[index];
                      return PostCard(
                        post: post,
                        onVote: () =>
                            context.read<PostCubit>().vote(post.id),
                      );
                    },
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }
}
