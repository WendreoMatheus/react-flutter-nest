import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'cubit/post_cubit.dart';
import 'repository/post_repository.dart';
import 'ui/screens/post_list_screen.dart';

void main() {
  runApp(const VotingPlatformApp());
}

class VotingPlatformApp extends StatelessWidget {
  const VotingPlatformApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Voting Platform',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: BlocProvider<PostCubit>(
        create: (_) => PostCubit(PostRepository())..loadPosts(),
        child: const PostListScreen(),
      ),
    );
  }
}
