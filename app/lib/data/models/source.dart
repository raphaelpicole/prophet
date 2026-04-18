class Source {
  final String id;
  final String slug;
  final String name;
  final String ideology;
  final int totalArticles;
  final int articles24h;
  final int analyzedCount;
  final int failedCount;
  final DateTime? lastFetchedAt;

  Source({
    required this.id,
    required this.slug,
    required this.name,
    required this.ideology,
    required this.totalArticles,
    required this.articles24h,
    required this.analyzedCount,
    required this.failedCount,
    this.lastFetchedAt,
  });

  factory Source.fromJson(Map<String, dynamic> json) {
    return Source(
      id: json['id'] ?? '',
      slug: json['slug'] ?? '',
      name: json['name'] ?? '',
      ideology: json['ideology'] ?? 'indefinido',
      totalArticles: json['total_articles'] ?? 0,
      articles24h: json['articles_24h'] ?? 0,
      analyzedCount: json['analyzed_count'] ?? 0,
      failedCount: json['failed_count'] ?? 0,
      lastFetchedAt: json['last_fetched_at'] != null
          ? DateTime.tryParse(json['last_fetched_at'])
          : null,
    );
  }

  ColorUtils get color {
    switch (ideology) {
      case 'esquerda': return ColorUtils(0xFF4CAF50); // verde
      case 'centro-esquerda': return ColorUtils(0xFF8BC34A);
      case 'centro': return ColorUtils(0xFF9E9E9E);
      case 'centro-direita': return ColorUtils(0xFFFF9800);
      case 'direita': return ColorUtils(0xFFF44336); // vermelho
      default: return ColorUtils(0xFF9E9E9E);
    }
  }
}

class ColorUtils {
  final int value;
  const ColorUtils(this.value);
}

class Region {
  final String id;
  final String name;
  final String code;
  final String? parentId;
  final List<Region> children;

  Region({
    required this.id,
    required this.name,
    required this.code,
    this.parentId,
    this.children = const [],
  });

  factory Region.fromJson(Map<String, dynamic> json) {
    return Region(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      parentId: json['parent_id'],
      children: (json['children'] as List?)
              ?.map((e) => Region.fromJson(e))
              .toList() ?? [],
    );
  }
}
