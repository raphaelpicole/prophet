import 'package:flutter/material.dart';

class AppTheme {
  static const Color bg = Color(0xFF0D0D0D);
  static const Color surface = Color(0xFF1A1A1A);
  static const Color card = Color(0xFF242424);
  static const Color primary = Color(0xFF6C5CE7);
  static const Color prophet = Color(0xFFA855F7);
  static const Color alerta = Color(0xFFFF6B6B);
  static const Color warning = Color(0xFFFFD93D);
  static const Color sucesso = Color(0xFF6BCB77);
  static const Color texto = Color(0xFFE0E0E0);
  static const Color textoSec = Color(0xFF9E9E9E);

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
      backgroundColor: bg,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: texto,
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
    ),
    cardTheme: const CardThemeData(
      color: card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: surface,
      selectedItemColor: primary,
      unselectedItemColor: textoSec,
      type: BottomNavigationBarType.fixed,
    ),
    textTheme: const TextTheme(
      headlineMedium: TextStyle(color: texto, fontWeight: FontWeight.bold),
      titleLarge: TextStyle(color: texto, fontWeight: FontWeight.w600),
      titleMedium: TextStyle(color: texto),
      bodyMedium: TextStyle(color: textoSec),
    ),
  );
}
