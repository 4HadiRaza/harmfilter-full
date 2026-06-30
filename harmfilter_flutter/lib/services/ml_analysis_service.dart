// lib/services/ml_analysis_service.dart

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:harmfilter_flutter/models/analysis_result.dart';

/// Service that communicates with the HarmFilter Python FastAPI backend.
///
/// Base URL is read from ML_API_URL in the .env file.
/// For ngrok: ML_API_URL=https://xxxx.ngrok-free.app
/// For local:  ML_API_URL=http://127.0.0.1:8000
class MLAnalysisService {
  static MLAnalysisService? _instance;
  MLAnalysisService._();
  static MLAnalysisService get instance =>
      _instance ??= MLAnalysisService._();

  // ── Config ────────────────────────────────────────────────────────────────

  String get _baseUrl {
    final url = dotenv.env['ML_API_URL'] ?? 'http://127.0.0.1:8000';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static const _connectTimeout = Duration(seconds: 10);
  static const _receiveTimeout = Duration(seconds: 60); // OCR can be slow

  // ── Health check ──────────────────────────────────────────────────────────

  /// Returns true if the ML API server is reachable.
  Future<bool> isServerReachable() async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/health'),
            headers: {'ngrok-skip-browser-warning': 'true'},
          )
          .timeout(_connectTimeout);
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // ── Text analysis ─────────────────────────────────────────────────────────

  /// Analyse [text] for hate speech.
  ///
  /// [language] must be 'english' or 'roman_urdu'.
  /// Throws [MLApiException] on network or server errors.
  Future<AnalysisResult> analyzeText(
    String text, {
    String language = 'english',
  }) async {
    final uri = Uri.parse('$_baseUrl/analyze/text');
    debugPrint('[MLAnalysisService] POST $uri  language=$language');

    late http.Response response;
    try {
      response = await http
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: jsonEncode({'text': text, 'language': language}),
          )
          .timeout(_receiveTimeout);
    } on Exception catch (e) {
      throw MLApiException(
        'Cannot reach the ML API server. Make sure it is running.\n'
        'Details: $e',
      );
    }

    return _parseResponse(response);
  }

  // ── Image analysis ────────────────────────────────────────────────────────

  /// Upload [imageBytes] for OCR + hate-speech classification.
  ///
  /// [filename] should include the extension (e.g. 'photo.jpg').
  /// [language] must be 'english' or 'roman_urdu'.
  Future<AnalysisResult> analyzeImage(
    Uint8List imageBytes,
    String filename, {
    String language = 'english',
  }) async {
    final uri = Uri.parse('$_baseUrl/analyze/image');
    debugPrint('[MLAnalysisService] POST $uri  filename=$filename  language=$language');

    late http.StreamedResponse streamed;
    try {
      final request = http.MultipartRequest('POST', uri)
        ..headers['ngrok-skip-browser-warning'] = 'true'
        ..fields['language'] = language
        ..files.add(
          http.MultipartFile.fromBytes(
            'image',
            imageBytes,
            filename: filename,
          ),
        );
      streamed = await request.send().timeout(_receiveTimeout);
    } on Exception catch (e) {
      throw MLApiException(
        'Cannot reach the ML API server for image analysis.\n'
        'Details: $e',
      );
    }

    final response = await http.Response.fromStream(streamed);
    return _parseResponse(response);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  AnalysisResult _parseResponse(http.Response response) {
    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return AnalysisResult.fromJson(json);
    }

    // Try to extract the detail message from FastAPI error JSON
    String detail = 'Unknown error';
    try {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      detail = json['detail']?.toString() ?? detail;
    } catch (_) {
      detail = response.body;
    }
    throw MLApiException(
      'ML API returned ${response.statusCode}: $detail',
    );
  }
}

/// Exception thrown when the ML API call fails.
class MLApiException implements Exception {
  final String message;
  const MLApiException(this.message);

  @override
  String toString() => 'MLApiException: $message';
}
