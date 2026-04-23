import 'package:flutter/material.dart';

class AppTheme {
  // Backgrounds
  static const Color bg = Color(0xFF0D0D0D);
  static const Color surface = Color(0xFF1A1A1A);
  static const Color card = Color(0xFF242424);
  static const Color cardLight = Color(0xFF2D2D2D);
  
  // Brand
  static const Color primary = Color(0xFF6C5CE7);
  static const Color primaryLight = Color(0xFF8B7FE8);
  static const Color prophet = Color(0xFFA855F7);
  static const Color accent = Color(0xFF00D4AA);
  
  // Status
  static const Color alerta = Color(0xFFFF6B6B);
  static const Color warning = Color(0xFFFFD93D);
  static const Color sucesso = Color(0xFF6BCB77);
  
  // Text
  static const Color texto = Color(0xFFE0E0E0);
  static const Color textoSec = Color(0xFF9E9E9E);
  static const Color textoDark = Color(0xFF666666);
  
  // Gradients
  static LinearGradient get primaryGradient => const LinearGradient(
    colors: [primary, prophet],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static LinearGradient get cardGradient => LinearGradient(
    colors: [card, cardLight],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  static LinearGradient get surfaceGradient => LinearGradient(
    colors: [surface.withOpacity(0.8), bg],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Shadows
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.2),
      blurRadius: 8,
      offset: const Offset(0, 4),
    ),
  ];
  
  static List<BoxShadow> get elevatedShadow => [
    BoxShadow(
      color: primary.withOpacity(0.15),
      blurRadius: 16,
      offset: const Offset(0, 8),
    ),
  ];
  
  // Glow effects
  static BoxDecoration glowBorder(Color color) => BoxDecoration(
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: color.withOpacity(0.3), width: 1),
    boxShadow: [
      BoxShadow(
        color: color.withOpacity(0.1),
        blurRadius: 8,
        spreadRadius: 1,
      ),
    ],
  );

  static ThemeData get dark => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bg,
    primaryColor: primary,
    colorScheme: const ColorScheme.dark(
      primary: primary,
      secondary: prophet,
      surface: surface,
      error: alerta,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: texto,
        fontSize: 22,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.5,
      ),
    ),
    cardTheme: CardThemeData(
      color: card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      shadowColor: Colors.black.withOpacity(0.3),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: surface,
      selectedItemColor: primary,
      unselectedItemColor: textoSec,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(color: texto, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: -1),
      headlineMedium: TextStyle(color: texto, fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: -0.5),
      headlineSmall: TextStyle(color: texto, fontSize: 18, fontWeight: FontWeight.w600),
      titleLarge: TextStyle(color: texto, fontSize: 16, fontWeight: FontWeight.w600),
      titleMedium: TextStyle(color: texto, fontSize: 14, fontWeight: FontWeight.w500),
      bodyLarge: TextStyle(color: texto, fontSize: 16),
      bodyMedium: TextStyle(color: textoSec, fontSize: 14),
      bodySmall: TextStyle(color: textoSec, fontSize: 12),
      labelLarge: TextStyle(color: primary, fontSize: 14, fontWeight: FontWeight.w600),
      labelSmall: TextStyle(color: textoDark, fontSize: 11),
    ),
    useMaterial3: true,
  );
}
