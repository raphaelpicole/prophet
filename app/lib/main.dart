import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'presentation/screens/radar_screen.dart';
import 'presentation/screens/analysis_screen.dart';
import 'presentation/screens/prophet_screen.dart';
import 'presentation/screens/map_screen.dart';
import 'presentation/screens/config_screen.dart';

void main() {
  runApp(const ProphetApp());
}

class ProphetApp extends StatelessWidget {
  const ProphetApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Prophet',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final _screens = const [
    RadarScreen(),
    AnalysisScreen(),
    ProphetScreen(),
    MapScreen(),
    ConfigScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppTheme.surface, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.radar),
              activeIcon: Icon(Icons.radar, color: AppTheme.primary),
              label: 'Radar',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.analytics_outlined),
              activeIcon: Icon(Icons.analytics, color: AppTheme.primary),
              label: 'Análise',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_awesome_outlined),
              activeIcon: Icon(Icons.auto_awesome, color: AppTheme.prophet),
              label: 'Profeta',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.public_outlined),
              activeIcon: Icon(Icons.public, color: AppTheme.primary),
              label: 'Mapa',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.settings_outlined),
              activeIcon: Icon(Icons.settings, color: AppTheme.primary),
              label: 'Config',
            ),
          ],
        ),
      ),
    );
  }
}
