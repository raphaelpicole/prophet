class ForeignSource {
  final String name;
  final String url;
  final String country;
  final String language;

  const ForeignSource({
    required this.name,
    required this.url,
    required this.country,
    required this.language,
  });

  static const List<ForeignSource> all = [
    ForeignSource(
      name: 'AP News',
      url: 'https://apnews.com/rss',
      country: 'USA',
      language: 'EN',
    ),
    ForeignSource(
      name: 'Al Jazeera English',
      url: 'https://www.aljazeera.com/xml/rss/all.xml',
      country: 'Qatar',
      language: 'EN',
    ),
    ForeignSource(
      name: 'France 24 English',
      url: 'https://www.france24.com/en/rss',
      country: 'France',
      language: 'EN',
    ),
    ForeignSource(
      name: 'DW English',
      url: 'https://rss.dw.com/rdf/rss-en-all',
      country: 'Germany',
      language: 'EN',
    ),
    ForeignSource(
      name: 'RTÉ News',
      url: 'https://www.rte.ie/rss/news.xml',
      country: 'Ireland',
      language: 'EN',
    ),
  ];
}
