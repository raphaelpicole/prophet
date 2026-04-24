import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'core/theme/app_theme.dart';
import 'presentation/screens/radar_screen.dart';
import 'presentation/screens/analysis_screen.dart';
import 'presentation/screens/prophet_screen.dart';
import 'presentation/screens/config_screen.dart';
import 'presentation/screens/admin_screen.dart';
import 'presentation/screens/story_detail_screen.dart';
import 'presentation/screens/article_detail_screen.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/profile_screen.dart';
import 'presentation/screens/paywall_screen.dart';
import 'data/models/story.dart';
import 'data/services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: "AIzaSyB-hRG0lUYwPdiR-r5_-X5vd6hDCaGaVSU",
      appId: "1:1075292745271:web:4a18cae0494ba86e7d19b2",
      messagingSenderId: "1075292745271",
      projectId: "primeapp-46b95",
      authDomain: "primeapp-46b95.firebaseapp.com",
    ),
  );
  runApp(const ProphetApp());
}

class ProphetApp extends StatefulWidget {
  const ProphetApp({super.key});

  @override
  State<ProphetApp> createState() => _ProphetAppState();
}

class _ProphetAppState extends State<ProphetApp> {
  final AuthService _authService = AuthService();
  bool _initialized = false;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _initAuth();
  }

  Future<void> _initAuth() async {
    await _authService.init();

    // Listener para mudanças de auth state (Firebase)
    _authService.onAuthStateChanged.listen((user) {
      if (mounted) {
        setState(() {
          _isLoggedIn = user != null;
        });
      }
    });

    setState(() {
      _initialized = true;
      _isLoggedIn = _authService.isLoggedIn;
    });
  }

  void _onLoginSuccess(AuthService auth) {
    setState(() => _isLoggedIn = true);
  }

  void _openPaywall(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PaywallScreen()),
    );
  }

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
          return MaterialPageRoute(
            builder: (_) => const AdminScreen(),
          );
        }
        return MaterialPageRoute(
          builder: (_) => _buildMainShell(),
        );
      },
      home: _buildMainShell(),
    );
  }

  Widget _buildMainShell() {
    if (!_initialized) {
      return Scaffold(
        backgroundColor: AppTheme.bg,
        body: const Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
      );
    }

    if (!_isLoggedIn) {
      return LoginScreen(
        authService: _authService,
        onLoginSuccess: _onLoginSuccess,
      );
    }

    return MainShell(
      authService: _authService,
      onOpenPaywall: _openPaywall,
    );
  }
}

class MainShell extends StatefulWidget {
  final AuthService authService;
  final void Function(BuildContext context) onOpenPaywall;

  const MainShell({
    super.key,
    required this.authService,
    required this.onOpenPaywall,
  });

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _checkDevParam();
  }

  void _checkDevParam() {
    final uri = Uri.base;
    if (uri.queryParameters.containsKey('dev')) {
      setState(() => _currentIndex = 4);
    }
  }

  List<Widget> _releaseScreens(BuildContext context) => [
    RadarScreen(authService: widget.authService, onOpenPaywall: widget.onOpenPaywall),
    AnalysisScreen(authService: widget.authService, onOpenPaywall: widget.onOpenPaywall),
    const ProphetScreen(),
    ProfileScreen(
      authService: widget.authService,
      onUpgrade: () => widget.onOpenPaywall(context),
    ),
  ];

  List<String> get _releaseLabels => ['Radar', 'Análise', 'Profeta', 'Perfil'];

  List<Widget> get _devScreens => [
    RadarScreen(authService: widget.authService, onOpenPaywall: widget.onOpenPaywall),
    AnalysisScreen(authService: widget.authService, onOpenPaywall: widget.onOpenPaywall),
    const ProphetScreen(),
    const ConfigScreen(),
    const AdminScreen(),
  ];

  List<String> get _devLabels => ['Radar', 'Análise', 'Profeta', 'Config', 'Admin'];

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 800;
    final isRelease = kReleaseMode;

    final screens = isRelease ? _releaseScreens(context) : _devScreens;
    final labels = isRelease ? _releaseLabels : _devLabels;

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
    final icons = [
      Icons.radar, Icons.analytics_outlined, Icons.auto_awesome_outlined,
      Icons.settings_outlined, Icons.admin_panel_settings_outlined,
    ];
    final activeIcons = [
      Icons.radar, Icons.analytics, Icons.auto_awesome,
      Icons.settings, Icons.admin_panel_settings,
    ];

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
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary.withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(
              isSelected ? activeIcons[i] : icons[i],
              color: isSelected ? AppTheme.primary : AppTheme.textoSec,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              labels[i],
              style: TextStyle(
                color: isSelected ? AppTheme.primary : AppTheme.textoSec,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav({required List<String> labels}) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(top: BorderSide(color: AppTheme.card, width: 1)),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(labels.length, (i) => _bottomNavItem(i, labels)),
          ),
        ),
      ),
    );
  }

  Widget _bottomNavItem(int i, List<String> labels) {
    final isSelected = _currentIndex == i;
    final icons = [
      Icons.radar, Icons.analytics_outlined, Icons.auto_awesome_outlined,
      Icons.settings_outlined, Icons.admin_panel_settings_outlined,
    ];
    final activeIcons = [
      Icons.radar, Icons.analytics, Icons.auto_awesome,
      Icons.settings, Icons.admin_panel_settings,
    ];

    return GestureDetector(
      onTap: () => setState(() => _currentIndex = i),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? activeIcons[i] : icons[i],
              color: isSelected ? AppTheme.primary : AppTheme.textoSec,
              size: 24,
            ),
            const SizedBox(height: 2),
            Text(
              labels[i],
              style: TextStyle(
                color: isSelected ? AppTheme.primary : AppTheme.textoSec,
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}