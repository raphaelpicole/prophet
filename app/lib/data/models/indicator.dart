class Indicator {
  final int totalStories;
  final int articlesToday;
  final Map<String, int> cycles;
  final List<HotStory> hotStories;
  final DateTime updatedAt;

  Indicator({
    required this.totalStories,
    required this.articlesToday,
    required this.cycles,
    required this.hotStories,
    required this.updatedAt,
  });

  factory Indicator.fromJson(Map<String, dynamic> json) {
    return Indicator(
      totalStories: json['total_stories'] ?? 0,
      articlesToday: json['articles_today'] ?? 0,
      cycles: Map<String, int>.from(json['cycles'] ?? {}),
      hotStories: (json['hot_stories'] as List?)
              ?.map((e) => HotStory.fromJson(e))
              .toList() ?? [],
      updatedAt: DateTime.tryParse(json['updated_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class HotStory {
  final String id;
  final String title;
  final int articleCount;
  final double? avgSentiment;

  HotStory({
    required this.id,
    required this.title,
    required this.articleCount,
    this.avgSentiment,
  });

  factory HotStory.fromJson(Map<String, dynamic> json) {
    return HotStory(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      articleCount: json['article_count'] ?? 0,
      avgSentiment: (json['avg_sentiment'] as num?)?.toDouble(),
    );
  }
}
