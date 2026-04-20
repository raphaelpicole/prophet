import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';
import '../../data/models/indicator.dart';
import '../../data/services/api_service.dart';
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
        _api.getStories(cycle: _selectedCycle, region: _selectedRegion, search: _searchQuery, limit: 100).catchError((_) => <Story>[]),
        _api.getIndicators().catchError((_) => null),
      ]);

      setState(() {
        _stories = results[0] as List<Story>;
        _indicator = results[1] as Indicator?;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _stories = [];
        _indicator = null;
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

  // ────────────────────────────────────────────────────────────────
  // Timeline data helpers
  // ────────────────────────────────────────────────────────────────
  List<MapEntry<DateTime, int>> _getStoriesPerDay() {
    final now = DateTime.now();
    final cutoff = now.subtract(const Duration(days: 7));
    final map = <DateTime, int>{};
    for (final s in _stories) {
      if (s.updatedAt.isAfter(cutoff)) {
        final day = DateTime(s.updatedAt.year, s.updatedAt.month, s.updatedAt.day);
        map[day] = (map[day] ?? 0) + 1;
      }
    }
    final sorted = map.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
    return sorted;
  }

  Map<String, List<MapEntry<DateTime, int>>> _getStoriesPerDayByCycle() {
    final now = DateTime.now();
    final cutoff = now.subtract(const Duration(days: 7));
    final result = <String, List<MapEntry<DateTime, int>>>{};
    for (final cycle in _cycles) {
      final map = <DateTime, int>{};
      for (final s in _stories.where((s) => s.cycle == cycle)) {
        if (s.updatedAt.isAfter(cutoff)) {
          final day = DateTime(s.updatedAt.year, s.updatedAt.month, s.updatedAt.day);
          map[day] = (map[day] ?? 0) + 1;
        }
      }
      result[cycle] = map.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
    }
    return result;
  }

  List<Story> _getRisingStories() {
    final cutoff = DateTime.now().subtract(const Duration(hours: 6));
    return _stories.where((s) => s.updatedAt.isAfter(cutoff)).toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
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
    final timelineData = _getStoriesPerDay();
    final timelineByCycle = _getStoriesPerDayByCycle();
    final risingStories = _getRisingStories();

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

              // Search + Filter row
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Column(
                    children: [
                      // Search bar
                      TextField(
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
                      const SizedBox(height: 10),
                      // Filter pills
                      Row(
                        children: [
                          Expanded(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
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
                          const SizedBox(width: 4),
                          Container(
                            width: 1,
                            height: 24,
                            color: AppTheme.surface,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  _regionChip('🌐', 'ALL', 'Todos', _selectedRegion == null, () => _setRegion(null)),
                                  _regionChip('🌎', 'SAM', 'SAM', _selectedRegion == 'SAM', () => _setRegion('SAM')),
                                  _regionChip('🇧🇷', 'BR', 'BR', _selectedRegion == 'BR', () => _setRegion('BR')),
                                  _regionChip('🇺🇸', 'US', 'US', _selectedRegion == 'US', () => _setRegion('US')),
                                  _regionChip('🇪🇺', 'EU', 'EU', _selectedRegion == 'EU', () => _setRegion('EU')),
                                  _regionChip('🇨🇳', 'CN', 'CN', _selectedRegion == 'CN', () => _setRegion('CN')),
                                  _regionChip('🇷🇺', 'RU', 'RU', _selectedRegion == 'RU', () => _setRegion('RU')),
                                  _regionChip('🌙', 'ME', 'ME', _selectedRegion == 'ME', () => _setRegion('ME')),
                                  _regionChip('🌍', 'AF', 'AF', _selectedRegion == 'AF', () => _setRegion('AF')),
                                  _regionChip('🌏', 'AS', 'AS', _selectedRegion == 'AS', () => _setRegion('AS')),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      // Active filters indicator
                      if (_selectedCycle != null || _selectedRegion != null || _searchQuery.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.filter_list, color: AppTheme.primary, size: 14),
                            const SizedBox(width: 4),
                            const Text('Filtros ativos: ', style: TextStyle(color: AppTheme.textoSec, fontSize: 11)),
                            if (_selectedCycle != null) _activeChip(_selectedCycle!, () => _setCycle(null)),
                            if (_selectedRegion != null) _activeChip(_selectedRegion!, () => _setRegion(null)),
                            if (_searchQuery.isNotEmpty) _activeChip('"$_searchQuery"', () {
                              _searchController.clear();
                              _doSearch('');
                            }),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 8)),

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

              // ────────────────────────────────────────────────────
              // 1. TIMELINE CHART
              // ────────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.show_chart, color: AppTheme.primary, size: 16),
                            const SizedBox(width: 6),
                            const Text(
                              '📊 Timeline — Últimos 7 dias',
                              style: TextStyle(
                                color: AppTheme.texto,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '${_stories.length} stories',
                              style: const TextStyle(color: AppTheme.textoSec, fontSize: 11),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 140,
                          child: timelineData.isEmpty
                              ? const Center(
                                  child: Text(
                                    'Sem dados de timeline ainda',
                                    style: TextStyle(color: AppTheme.textoSec, fontSize: 12),
                                  ),
                                )
                              : _buildTimelineChart(timelineData, timelineByCycle),
                        ),
                        const SizedBox(height: 8),
                        // Cycle legend
                        _buildCycleLegend(),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 20)),

              // ────────────────────────────────────────────────────
              // 2. TRENDS SECTION
              // ────────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Cycles row
                      Row(
                        children: [
                          const Icon(Icons.trending_up, color: Colors.orange, size: 16),
                          const SizedBox(width: 6),
                          const Text(
                            '🏆 Top Ciclos',
                            style: TextStyle(
                              color: AppTheme.texto,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _buildTopCycles(indicator.cycles),
                      const SizedBox(height: 20),

                      // Rising stories
                      Row(
                        children: [
                          const Icon(Icons.bolt, color: AppTheme.primary, size: 16),
                          const SizedBox(width: 6),
                          const Text(
                            '⚡ Novas Stories (últimas 6h)',
                            style: TextStyle(
                              color: AppTheme.texto,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${risingStories.length}',
                            style: const TextStyle(color: AppTheme.textoSec, fontSize: 11),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      risingStories.isEmpty
                          ? Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.card,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Text(
                                'Nenhuma story nova nas últimas 6h',
                                style: TextStyle(color: AppTheme.textoSec, fontSize: 12),
                              ),
                            )
                          : SizedBox(
                              height: 90,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: risingStories.length,
                                itemBuilder: (ctx, i) => _risingCard(risingStories[i]),
                              ),
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

  // ────────────────────────────────────────────────────────────────
  // Timeline chart builder
  // ────────────────────────────────────────────────────────────────
  Widget _buildTimelineChart(
    List<MapEntry<DateTime, int>> totalData,
    Map<String, List<MapEntry<DateTime, int>>> byCycle,
  ) {
    // Build last-7-days x-axis
    final now = DateTime.now();
    final days = List.generate(7, (i) {
      final d = now.subtract(Duration(days: 6 - i));
      return DateTime(d.year, d.month, d.day);
    });

    // Color per cycle
    final cycleColors = {
      'conflito': AppTheme.alerta,
      'economico': AppTheme.warning,
      'politico': AppTheme.primary,
      'social': AppTheme.sucesso,
      'tecnologico': Colors.blue,
      'ambiental': Colors.green,
      'cultural': Colors.purple,
    };

    // Build bar groups (one group per day)
    final maxY = totalData.fold<int>(1, (m, e) => e.value > m ? e.value : m).toDouble();

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: maxY < 1 ? 1 : maxY + 1,
        barGroups: List.generate(days.length, (i) {
          final day = days[i];
          final total = totalData.where((e) =>
            e.key.year == day.year && e.key.month == day.month && e.key.day == day.day
          ).fold(0, (sum, e) => sum + e.value);

          return BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: total.toDouble(),
                width: 14,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                color: AppTheme.primary.withValues(alpha: 0.85),
                rodStackItems: [],
              ),
            ],
          );
        }),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (v, _) {
                final day = days[v.toInt()];
                final labels = ['D-6','D-5','D-4','D-3','D-2','D-1','Hoje'];
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    labels[v.toInt()],
                    style: const TextStyle(color: AppTheme.textoSec, fontSize: 9),
                  ),
                );
              },
            ),
          ),
        ),
        gridData: FlGridData(show: false),
        borderData: FlBorderData(show: false),
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            getTooltipColor: (_) => AppTheme.card,
            getTooltipItem: (g, _, __, ___) {
              final day = days[g.x.toInt()];
              final label = '${day.day}/${day.month}';
              return BarTooltipItem(
                '$label\n${g.barRods.first.toY.toInt()} stories',
                const TextStyle(color: AppTheme.texto, fontSize: 11),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildCycleLegend() {
    final cycleColors = {
      'conflito': AppTheme.alerta,
      'economico': AppTheme.warning,
      'politico': AppTheme.primary,
      'social': AppTheme.sucesso,
      'tecnologico': Colors.blue,
      'ambiental': Colors.green,
      'cultural': Colors.purple,
    };
    return Wrap(
      spacing: 12,
      runSpacing: 4,
      children: _cycles.map((c) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8, height: 8,
            decoration: BoxDecoration(
              color: cycleColors[c] ?? AppTheme.textoSec,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 4),
          Text(
            c[0].toUpperCase() + c.substring(1),
            style: const TextStyle(color: AppTheme.textoSec, fontSize: 10),
          ),
        ],
      )).toList(),
    );
  }

  Widget _buildTopCycles(Map<String, int> cycles) {
    if (cycles.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Text(
          'Sem dados de ciclos',
          style: TextStyle(color: AppTheme.textoSec, fontSize: 12),
        ),
      );
    }
    final sorted = cycles.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final top = sorted.take(5).toList();
    final maxVal = top.isNotEmpty ? top.first.value : 1;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: top.map((e) {
          final color = _cycleColor(e.key);
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Container(
                  width: 8, height: 8,
                  decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
                ),
                const SizedBox(width: 8),
                Text(
                  e.key[0].toUpperCase() + e.key.substring(1),
                  style: const TextStyle(color: AppTheme.texto, fontSize: 12),
                ),
                const Spacer(),
                Text(
                  '${e.value}',
                  style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 80,
                  child: LinearProgressIndicator(
                    value: e.value / maxVal,
                    backgroundColor: AppTheme.surface,
                    color: color,
                    borderRadius: BorderRadius.circular(3),
                    minHeight: 4,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _risingCard(Story story) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/story', arguments: story),
      child: Container(
        width: 200,
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _cycleColor(story.cycle).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    story.cycle.toUpperCase(),
                    style: TextStyle(
                      color: _cycleColor(story.cycle),
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.bolt, color: AppTheme.primary, size: 12),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              story.title,
              style: const TextStyle(color: AppTheme.texto, fontSize: 12, fontWeight: FontWeight.w500),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            Text(
              'há ${_timeAgo(story.updatedAt)}',
              style: const TextStyle(color: AppTheme.textoSec, fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }

  Color _cycleColor(String cycle) {
    switch (cycle) {
      case 'conflito': return AppTheme.alerta;
      case 'economico': return AppTheme.warning;
      case 'politico': return AppTheme.primary;
      case 'social': return AppTheme.sucesso;
      case 'tecnologico': return Colors.blue;
      case 'ambiental': return Colors.green;
      default: return AppTheme.textoSec;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }

  Widget _filterChip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: selected ? AppTheme.primary : AppTheme.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.surface,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : AppTheme.textoSec,
              fontSize: 12,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ),
      ),
    );
  }

  Widget _regionChip(String flag, String code, String label, bool selected, VoidCallback onTap) {
    final color = _regionColor(code);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? color.withValues(alpha: 0.2) : AppTheme.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: selected ? color : AppTheme.surface),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(flag, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(
                color: selected ? color : AppTheme.textoSec,
                fontSize: 11, fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              )),
            ],
          ),
        ),
      ),
    );
  }

  Widget _activeChip(String label, VoidCallback onRemove) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: onRemove,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: AppTheme.primary.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label, style: const TextStyle(color: AppTheme.primary, fontSize: 11)),
              const SizedBox(width: 4),
              const Icon(Icons.close, color: AppTheme.primary, size: 12),
            ],
          ),
        ),
      ),
    );
  }

  Color _regionColor(String code) {
    switch (code) {
      case 'ALL': return AppTheme.primary;
      case 'SAM': return Colors.orange;
      case 'BR': return Colors.green;
      case 'US': return Colors.blue;
      case 'EU': return Colors.blue.shade700;
      case 'CN': return Colors.red;
      case 'RU': return Colors.purple.shade800;
      case 'ME': return Colors.amber;
      case 'AF': return Colors.brown;
      case 'AS': return Colors.deepOrange;
      default: return AppTheme.primary;
    }
  }
}
