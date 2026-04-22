class ApiConstants {
  // Backend Vercel (produção)
  static const String baseUrl = 'https://prophet-olive.vercel.app/api';

  // Supabase anon key (public, safe to expose)
  static const String supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXhzeHllc2xpZWtidWhna2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzU4MjEsImV4cCI6MjA5MTc1MTgyMX0.pdXEWW2YUa4NVmaeVE5FaNv5o1UycQl3oqi-ERK-fWQ';

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

class PlanConfig {
  static const Map<String, dynamic> FREE_LIMITS = {
    'stories_per_day': 10,
    'predictions_per_week': 3,
    'history_days': 7,
  };

  static const Map<String, dynamic> PRO_LIMITS = {
    'stories_per_day': null, // unlimited
    'predictions_per_week': null, // unlimited
    'history_days': 365,
  };
}
