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