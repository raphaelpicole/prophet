class ApiConstants {
  // Backend Vercel (produção)
  static const String baseUrl = 'https://prophet-h1ildogos-raphaelpicoles-projects.vercel.app/api';

  // Mapbox public token
  static const String mapboxToken = 'pk.eyJ1IjoicmFwaGFlbHBpY29sZSIsImEiOiJjbW04NzR5NDcwb2xjMnFvbDd5OWVocHlvIn0.5miL0Itl3FzRL4hp9TMv7w';
}

class AppConstants {
  static const String appName = 'Prophet';
  static const List<String> cycles = [
    'conflito', 'pandemia', 'economico', 'politico',
    'social', 'tecnologico', 'ambiental', 'cultural',
  ];
}
