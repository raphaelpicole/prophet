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
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      summary: json['summary'],
      mainSubject: json['main_subject'] ?? '',
      cycle: json['cycle'] ?? 'politico',
      sentimentTrend: json['sentiment_trend'] ?? 'stable',
      hotness: json['hotness'] ?? 0,
      articleCount: json['article_count'] ?? 0,
      updatedAt: DateTime.tryParse(json['updated_at'] ?? '') ?? DateTime.now(),
    );
  }
}
