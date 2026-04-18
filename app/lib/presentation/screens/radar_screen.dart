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
  String? _selectedCycle;
  String? _selectedRegion;
  String _searchQuery = '';
  final _searchController = TextEditingController();

  static const _cycles = [
    'conflito', 'economico', 'politico',
    'social', 'tecnologico', 'ambiental', 'cultural',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _loading = true; _error = null; });
    
    try {
      final results = await Future.wait([
        _api.getStories(cycle: _selectedCycle, region: _selectedRegion, search: _searchQuery, limit: 20).catchError((_) => <Story>[]),
        _api.getIndicators().catchError((_) => null),
      ]);

      final stories = results[0] as List<Story>;
      final indicator = results[1] as Indicator?;

      setState(() {
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

  void _setCycle(String? cycle) {
    setState(() { _selectedCycle = cycle; });
    _loadData();
  }

  void _setRegion(String? region) {
    setState(() { _selectedRegion = region; });
    _loadData();
  }

  void _doSearch(String query) {
    setState(() { _searchQuery = query; });
    _loadData();
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

              // Search bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: TextField(
                    controller: _searchController,
                    style: const TextStyle(color: AppTheme.texto, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Buscar histórias...',
                      hintStyle: const TextStyle(color: AppTheme.textoSec),
                      prefixIcon: const Icon(Icons.search, color: AppTheme.textoSec, size: 20),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, color: AppTheme.textoSec, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                _doSearch('');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: AppTheme.card,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onSubmitted: _doSearch,
                    onChanged: (v) => setState(() { _searchQuery = v; }),
                  ),
                ),
              ),

              // Filtro por ciclo
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _filterChip('Todos', _selectedCycle == null, () => _setCycle(null)),
                      ..._cycles.map((c) => _filterChip(
                        c[0].toUpperCase() + c.substring(1),
                        _selectedCycle == c,
                        () => _setCycle(c),
                      )),
                    ],
                  ),
                ),
              ),

              // Filtro por região
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 36,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _regionChip('🌐', 'Todos', _selectedRegion == null, () => _setRegion(null)),
                      _regionChip('🌎', 'América do Sul', _selectedRegion == 'SAM', () => _setRegion('SAM')),
                      _regionChip('🌍', 'Europa', _selectedRegion == 'EUR', () => _setRegion('EUR')),
                      _regionChip('🟡', 'Oriente Médio', _selectedRegion == 'MID', () => _setRegion('MID')),
                      _regionChip('🌏', 'Ásia', _selectedRegion == 'ASI', () => _setRegion('ASI')),
                      _regionChip('🌐', 'América do Norte', _selectedRegion == 'NAM', () => _setRegion('NAM')),
                      _regionChip('🌿', 'África', _selectedRegion == 'AFR', () => _setRegion('AFR')),
                      _regionChip('🔵', 'Oceania', _selectedRegion == 'OCE', () => _setRegion('OCE')),
                      _regionChip('🌍', 'Global', _selectedRegion == 'GLB', () => _setRegion('GLB')),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 12)),

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

  Widget _filterChip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? AppTheme.primary : AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.textoSec.withValues(alpha: 0.3),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : AppTheme.textoSec,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _regionChip(String flag, String label, bool selected, VoidCallback onTap) {
    final color = _regionColor(label);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? color.withValues(alpha: 0.2) : AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: selected ? color : AppTheme.surface),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(flag, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(
                color: selected ? color : AppTheme.textoSec,
                fontSize: 11, fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              )),
            ],
          ),
        ),
      ),
    );
  }

  Color _regionColor(String label) {
    if (label.contains('Sul')) return Colors.orange;
    if (label.contains('Europa')) return Colors.blue;
    if (label.contains('Oriente')) return Colors.red;
    if (label.contains('Ásia')) return Colors.purple;
    if (label.contains('América do Norte')) return Colors.teal;
    if (label.contains('África')) return Colors.brown;
    if (label.contains('Oceania')) return Colors.cyan;
    return AppTheme.primary;
  }
}