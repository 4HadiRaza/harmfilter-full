import 'dart:typed_data';
import 'package:cloudinary_public/cloudinary_public.dart';
import 'package:flutter/foundation.dart';

class CloudinaryService {
  static const String _cloudName = 'dwi6kfh3f';
  static const String _uploadPreset = 'Harmfilter';

  final CloudinaryPublic _cloudinary = CloudinaryPublic(
    _cloudName,
    _uploadPreset,
    cache: false,
  );

  /// Uploads image bytes to Cloudinary and returns the secure URL.
  /// Works on all platforms including Web.
  Future<String> uploadImage(Uint8List bytes, String fileName) async {
    try {
      final response = await _cloudinary.uploadFile(
        CloudinaryFile.fromBytesData(
          bytes,
          identifier: fileName,
          folder: 'harmfilter_posts',
        ),
      );
      return response.secureUrl;
    } catch (e) {
      debugPrint('Cloudinary upload error: $e');
      rethrow;
    }
  }
}
