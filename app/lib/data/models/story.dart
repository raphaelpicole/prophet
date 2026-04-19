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
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    // hotness pode vir como 'hotness' ou '热度' (chinês)
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
    );
  }
}
