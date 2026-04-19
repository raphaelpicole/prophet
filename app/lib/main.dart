import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'presentation/screens/radar_screen.dart';
import 'presentation/screens/analysis_screen.dart';
import 'presentation/screens/prophet_screen.dart';
import 'presentation/screens/map_screen.dart';
import 'presentation/screens/config_screen.dart';
import 'presentation/screens/admin_screen.dart';
import 'presentation/screens/story_detail_screen.dart';
import 'presentation/screens/article_detail_screen.dart';
import 'data/models/story.dart';

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
      initialRoute: '/',
      onGenerateRoute: (settings) {
        if (settings.name == '/story') {
          final story = settings.arguments as Story;
          return MaterialPageRoute(
            builder: (_) => StoryDetailScreen(story: story),
          );
        }
        if (settings.name == '/article') {
          final story = settings.arguments as Story;
          return MaterialPageRoute(
            builder: (_) => ArticleDetailScreen(story: story),
          );
        }
        return MaterialPageRoute(
          builder: (_) => const MainShell(),
        );
      },
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
    AdminScreen(),
  ];

  final _labels = ['Radar', 'Análise', 'Profeta', 'Mapa', 'Config', 'Admin'];

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 800;

    return Scaffold(
      body: Row(
        children: [
          if (isWide) _buildSideNav(),
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: _screens,
            ),
          ),
        ],
      ),
      bottomNavigationBar: isWide ? null : _buildBottomNav(),
    );
  }

  Widget _buildSideNav() {
    final icons = [Icons.radar, Icons.analytics_outlined, Icons.auto_awesome_outlined, Icons.public_outlined, Icons.settings_outlined, Icons.admin_panel_settings_outlined];
    final activeIcons = [Icons.radar, Icons.analytics, Icons.auto_awesome, Icons.public, Icons.settings, Icons.admin_panel_settings];
    final labels = ['Radar', 'Análise', 'Profeta', 'Mapa', 'Config'];

    return Container(
      width: 80,
      color: AppTheme.surface,
      child: Column(
        children: [
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.visibility, color: AppTheme.primary, size: 28),
          ),
          const SizedBox(height: 24),
          ...List.generate(_screens.length, (i) => _sideNavItem(i, icons, activeIcons, labels)),
        ],
      ),
    );
  }

  Widget _sideNavItem(int i, List<IconData> icons, List<IconData> activeIcons, List<String> labels) {
    final isSelected = _currentIndex == i;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = i),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary.withValues(alpha: 0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Icon(isSelected ? activeIcons[i] : icons[i],
              color: isSelected ? AppTheme.primary : AppTheme.textoSec, size: 24),
            const SizedBox(height: 4),
            Text(labels[i], style: TextStyle(
              color: isSelected ? AppTheme.primary : AppTheme.textoSec,
              fontSize: 10, fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppTheme.surface, width: 1)),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppTheme.bg,
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.textoSec,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.radar), label: 'Radar'),
          BottomNavigationBarItem(icon: Icon(Icons.analytics_outlined), label: 'Análise'),
          BottomNavigationBarItem(icon: Icon(Icons.auto_awesome_outlined), label: 'Profeta'),
          BottomNavigationBarItem(icon: Icon(Icons.public_outlined), label: 'Mapa'),
          BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), label: 'Config'),
          BottomNavigationBarItem(icon: Icon(Icons.admin_panel_settings_outlined), label: 'Admin'),
        ],
      ),
    );
  }
}