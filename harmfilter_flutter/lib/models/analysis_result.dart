// lib/models/analysis_result.dart

/// Represents the result returned by the HarmFilter ML API.
class AnalysisResult {
  /// Classification label: 'hateful' | 'offensive' | 'normal'
  final String label;

  /// Confidence score in [0.0, 1.0]
  final double confidence;

  /// Per-class probability map:
  ///   { 'hateful': 0.9, 'offensive': 0.07, 'normal': 0.03 }
  final Map<String, double> probabilities;

  /// Text extracted by OCR (only set for image analysis)
  final String? extractedText;

  /// Language used for classification: 'english' | 'roman_urdu'
  final String language;

  /// How long the server took to process (ms)
  final int processingTimeMs;

  const AnalysisResult({
    required this.label,
    required this.confidence,
    required this.probabilities,
    this.extractedText,
    this.language = 'english',
    this.processingTimeMs = 0,
  });

  factory AnalysisResult.fromJson(Map<String, dynamic> json) {
    final rawProbs = json['probabilities'] as Map<String, dynamic>? ?? {};
    return AnalysisResult(
      label: json['label'] as String? ?? 'normal',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      probabilities: rawProbs.map(
        (k, v) => MapEntry(k, (v as num).toDouble()),
      ),
      extractedText: json['extracted_text'] as String?,
      language: json['language'] as String? ?? 'english',
      processingTimeMs: json['processing_time_ms'] as int? ?? 0,
    );
  }

  /// Human-readable label for display
  String get displayLabel {
    switch (label) {
      case 'hateful':
        return 'Hate Speech';
      case 'offensive':
        return 'Offensive Language';
      default:
        return 'Normal';
    }
  }

  bool get isHarmful => label == 'hateful' || label == 'offensive';
}
