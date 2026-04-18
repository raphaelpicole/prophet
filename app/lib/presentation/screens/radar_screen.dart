import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';
import '../../data/models/indicator.dart';
import '../../data/services/api_service.dart';
import '../../data/services/mock_service.dart';
import '../widgets/kpi_card.dart';
import '../widgets/story_card.dart';
import '../widgets/cycle_donut.dart';

class RadarScreen extends StatefulWidget {
  const RadarScreen({super.key});

  @override
  State<RadarScreen> createState() => _RadarScreenState();
}

class _RadarScreenState extends State<RadarScreen> {
  final ApiService _api = ApiService();
  
  List<Story> _stories = [];
  Indicator? _indicator;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _loading = true; _error = null; });
    
    try {
      // Carrega stories e indicators em paralelo
      final results = await Future.wait([
        _api.getStories(limit: 20).catchError((_) => <Story>[]),
        _api.getIndicators().catchError((_) => null),
      ]);

      final stories = results[0] as List<Story>;
      final indicator = results[1] as Indicator?;

      setState(() {
        // Se API retornou vazio, usa mock como fallback
        _stories = stories.isEmpty ? MockService.getStories() : stories;
        _indicator = indicator ?? MockService.getIndicator();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _stories = MockService.getStories();
        _indicator = MockService.getIndicator();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: AppTheme.bg,
        body: const Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
      );
    }

    final indicator = _indicator!;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: AppTheme.primary,
          child: CustomScrollView(
            slivers: [
              // AppBar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.visibility, color: AppTheme.primary, size: 24),
                      const SizedBox(width: 8),
                      const Text(
                        '🔮 Prophet',
                        style: TextStyle(
                          color: AppTheme.texto,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.refresh, color: AppTheme.textoSec),
                        onPressed: _loadData,
                      ),
                      IconButton(
                        icon: const Icon(Icons.person_outline, color: AppTheme.textoSec),
                        onPressed: () {},
                      ),
                    ],
                  ),
                ),
              ),

              // KPI Cards
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 110,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      KpiCard(
                        label: 'artigos /dia',
                        value: '${indicator.articlesToday}',
                        icon: Icons.article_outlined,
                        color: Colors.blue,
                      ),
                      const SizedBox(width: 10),
                      KpiCard(
                        label: 'stories',
                        value: '${indicator.totalStories}',
                        icon: Icons.local_fire_department,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 10),
                      KpiCard(
                        label: 'previsões',
                        value: '5',
                        icon: Icons.auto_awesome,
                        color: AppTheme.prophet,
                      ),
                      const SizedBox(width: 10),
                      KpiCard(
                        label: 'alertas',
                        value: indicator.hotStories.length.toString(),
                        icon: Icons.warning_amber,
                        color: AppTheme.alerta,
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 20)),

              // Histórias Quentes
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      const Icon(Icons.local_fire_department, color: Colors.orange, size: 16),
                      const SizedBox(width: 6),
                      const Text(
                        '🔥 Histórias Quentes',
                        style: TextStyle(
                          color: AppTheme.texto,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 10)),

              // Story list
              _stories.isEmpty
                  ? SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(Icons.inbox, color: AppTheme.textoSec, size: 48),
                              const SizedBox(height: 12),
                              Text(
                                'Nenhuma story ainda.\nRode o /api/collect para popular o banco.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: AppTheme.textoSec),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final story = _stories[index];
                            return StoryCard(
                              story: story,
                              onTap: () {
                                Navigator.pushNamed(context, '/story', arguments: story);
                              },
                            );
                          },
                          childCount: _stories.length,
                        ),
                      ),
                    ),

              const SliverToBoxAdapter(child: SizedBox(height: 20)),

              // Ciclo Dominante
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: CycleDonut(cycles: indicator.cycles),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }
}