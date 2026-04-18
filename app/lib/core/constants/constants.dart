class ApiConstants {
  // Backend Vercel (produção)
  static const String baseUrl = 'https://prophet-olive.vercel.app/api';
}

class AppConstants {
  static const String appName = 'Prophet';
  static const List<String> cycles = [
    'conflito', 'pandemia', 'economico', 'politico',
    'social', 'tecnologico', 'ambiental', 'cultural',
  ];
}
