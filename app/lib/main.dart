import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
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
        if (settings.name == '/admin' && kReleaseMode) {
          // Secret admin route accessible even in release mode
          return MaterialPageRoute(
            builder: (_) => const AdminScreen(),
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

  final _allScreens = const [
    RadarScreen(),
    AnalysisScreen(),
    ProphetScreen(),
    MapScreen(),
    ConfigScreen(),
    AdminScreen(),
  ];

  final _allLabels = ['Radar', 'Análise', 'Profeta', 'Mapa', 'Config', 'Admin'];
  final _releaseLabels = ['Radar', 'Análise', 'Profeta', 'Mapa'];

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 800;
    final isRelease = kReleaseMode;

    // In release mode, hide Admin and Config from navigation
    final screens = isRelease ? _allScreens.sublist(0, 4) : _allScreens;
    final labels = isRelease ? _releaseLabels : _allLabels;

    return Scaffold(
      body: Row(
        children: [
          if (isWide) _buildSideNav(screens: screens, labels: labels),
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: screens,
            ),
          ),
        ],
      ),
      bottomNavigationBar: isWide ? null : _buildBottomNav(labels: labels),
    );
  }

  Widget _buildSideNav({required List<Widget> screens, required List<String> labels}) {
    final icons = [Icons.radar, Icons.analytics_outlined, Icons.auto_awesome_outlined, Icons.public_outlined, Icons.settings_outlined, Icons.admin_panel_settings_outlined];
    final activeIcons = [Icons.radar, Icons.analytics, Icons.auto_awesome, Icons.public, Icons.settings, Icons.admin_panel_settings];

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
          ...List.generate(screens.length, (i) => _sideNavItem(i, icons, activeIcons, labels)),
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

  Widget _buildBottomNav({required List<String> labels}) {
    final icons = [Icons.radar, Icons.analytics_outlined, Icons.auto_awesome_outlined, Icons.public_outlined, Icons.settings_outlined, Icons.admin_panel_settings_outlined];

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
        items: List.generate(labels.length, (i) => BottomNavigationBarItem(
          icon: Icon(icons[i]),
          label: labels[i],
        )),
      ),
    );
  }
}
