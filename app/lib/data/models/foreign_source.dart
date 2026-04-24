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
      name: '📰 Fonte P',
      url: '',
      country: 'USA',
      language: 'EN',
    ),
    ForeignSource(
      name: '🌙 Fonte K',
      url: '',
      country: 'Qatar',
      language: 'EN',
    ),
    ForeignSource(
      name: '🇫🇷 Fonte L',
      url: '',
      country: 'France',
      language: 'EN',
    ),
    ForeignSource(
      name: '🎙️ Fonte M',
      url: '',
      country: 'Germany',
      language: 'EN',
    ),
    ForeignSource(
      name: '📻 Fonte N',
      url: '',
      country: 'Ireland',
      language: 'EN',
    ),
  ];
}
