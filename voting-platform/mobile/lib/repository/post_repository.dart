import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import '../models/post.dart';

/// Returns the correct API base URL based on the current platform:
///  - **Web**: `http://localhost:3000` (browser runs on the host machine)
///  - **Android emulator**: `http://10.0.2.2:3000` (alias for host localhost)
///  - **iOS simulator / desktop**: `http://localhost:3000`
String _resolveBaseUrl() {
  if (kIsWeb) return 'http://localhost:3000';

  // On Android emulator 10.0.2.2 maps to the host machine's loopback.
  // For iOS simulator and desktop, localhost works directly.
  // Defaulting to 10.0.2.2 for mobile since Android is the most common
  // emulator target during interviews. Switch to localhost if testing on iOS.
  return 'http://10.0.2.2:3000';
}

class PostRepository {
  PostRepository({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: _resolveBaseUrl(),
                headers: {
                  'Authorization':
                      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXItaWQiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDB9.demo',
                  'Content-Type': 'application/json',
                },
              ),
            );

  final Dio _dio;

  Future<List<Post>> fetchAll() async {
    final response = await _dio.get<List<dynamic>>('/posts');
    final data = response.data ?? <dynamic>[];
    return data
        .map((dynamic e) => Post.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Post> vote(String postId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/posts/$postId/vote',
    );
    return Post.fromJson(response.data ?? <String, dynamic>{});
  }
}
