import 'dart:convert';

class Prediction {
  final String id;
  final String title;
  final String? description;
  final double probability;
  final String? historicalAnalogue;
  final String? reasoning;
  final String? confidence;
  final int? horizonDays;
  final String? outcome;
  final DateTime createdAt;

  Prediction({
    required this.id,
    required this.title,
    this.description,
    required this.probability,
    this.historicalAnalogue,
    this.reasoning,
    this.confidence,
    this.horizonDays,
    this.outcome,
    required this.createdAt,
  });

  factory Prediction.fromJson(Map<String, dynamic> json) {
    // description might be JSON string: '{"reasoning":"...","historical_analogue":"..."}'
    String? desc = json['description'];
    Map<String, dynamic>? descObj;
    if (desc != null && desc.startsWith('{')) {
      try { descObj = jsonDecode(desc); } catch (_) { descObj = null; }
    }
    return Prediction(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: descObj?['reasoning'] ?? desc ?? json['description'],
      probability: (json['probability'] ?? 0.5).toDouble(),
      historicalAnalogue: descObj?['historical_analogue'] ?? json['historical_analogue'],
      reasoning: descObj?['reasoning'] ?? json['reasoning'],
      confidence: descObj?['confidence'] ?? json['confidence'],
      horizonDays: descObj?['horizon_days'] ?? json['horizon_days'],
      outcome: json['outcome'],
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class Story {
  final String id;
  final String title;
  final String? summary;
  final String mainSubject;
  final String cycle;
  final String sentimentTrend;
  final int hotness;
  final int articleCount;
  final DateTime updatedAt;
  final String? region;
  final List<PreviewArticle> previewArticles;
  final Prediction? prediction;
  // Article selecionado na tela de detail (para mostrar info do artigo específico)
  final PreviewArticle? selectedArticle;

  Story({
    required this.id,
    required this.title,
    this.summary,
    required this.mainSubject,
    required this.cycle,
    required this.sentimentTrend,
    required this.hotness,
    required this.articleCount,
    required this.updatedAt,
    this.region,
    this.previewArticles = const [],
    this.prediction,
    this.selectedArticle,
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    num hotnessRaw = json['hotness'] ?? json['热度'] ?? 0;
    return Story(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      summary: json['summary'],
      mainSubject: json['main_subject'] ?? '',
      cycle: json['cycle'] ?? 'politico',
      sentimentTrend: json['sentiment_trend'] ?? 'stable',
      hotness: hotnessRaw.toInt(),
      articleCount: json['article_count'] ?? 0,
      updatedAt: DateTime.tryParse(json['updated_at'] ?? '') ?? DateTime.now(),
      region: json['region'],
      previewArticles: (json['preview_articles'] as List<dynamic>?)
              ?.map((a) => PreviewArticle.fromJson(a))
              .toList() ??
          [],
      prediction: json['prediction'] != null ? Prediction.fromJson(json['prediction']) : null,
      selectedArticle: json['selectedArticle'] != null
          ? PreviewArticle.fromJson(json['selectedArticle'])
          : null,
    );
  }
}

class PreviewArticle {
  final String id;
  final String title;
  final String? url;
  final String sourceId;
  final DateTime publishedAt;
  final String? summary;

  PreviewArticle({
    required this.id,
    required this.title,
    this.url,
    required this.sourceId,
    required this.publishedAt,
    this.summary,
  });

  factory PreviewArticle.fromJson(Map<String, dynamic> json) {
    return PreviewArticle(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      url: json['url'],
      sourceId: json['source_id'] ?? '',
      publishedAt: DateTime.tryParse(json['published_at'] ?? '') ?? DateTime.now(),
      summary: json['summary'],
    );
  }
}
