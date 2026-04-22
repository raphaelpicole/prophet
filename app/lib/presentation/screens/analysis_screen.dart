import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';
import '../../data/models/source.dart';
import '../../data/models/foreign_source.dart';
import '../../data/services/api_service.dart';

class AnalysisScreen extends StatefulWidget {
  const AnalysisScreen({super.key});

  @override
  State<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends State<AnalysisScreen> with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService();
  bool _loading = true;
  String? _error;
  String _selectedSource = 'all';
  late TabController _tabController;

  // ALL sources from database
  List<Source> _allSources = [];
  // Stories for source stats
  List<Story> _allStories = [];
  Map<String, int> _sourceArticleCount = {};
  Map<String, double> _sourceSentiment = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        _api.getSources().catchError((_) => <Source>[]),
        _api.getStories(region: null, limit: 50).catchError((_) => <Story>[]),
      ]);
      final sources = results[0] as List<Source>;
      final stories = results[1] as List<Story>;
      if (mounted) {
        setState(() {
          _allSources = sources;
          _allStories = stories;
          _buildSourceStats(stories);
          _loading = false;
        });
      }
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  void _buildSourceStats(List<Story> stories) {
    final counts = <String, int>{};
    final sentimentTotals = <String, double>{};
    final sentimentCounts = <String, int>{};

    for (final story in stories) {
      for (final article in story.previewArticles) {
        final sid = article.sourceId;
        counts[sid] = (counts[sid] ?? 0) + 1;
      }
    }

    for (final story in stories) {
      for (final article in story.previewArticles) {
        final sid = article.sourceId;
        double sentVal = story.sentimentTrend == 'rising' ? 1.0
            : story.sentimentTrend == 'falling' ? -1.0 : 0.0;
        sentimentTotals[sid] = (sentimentTotals[sid] ?? 0) + sentVal;
        sentimentCounts[sid] = (sentimentCounts[sid] ?? 0) + 1;
      }
    }

    final sentiments = <String, double>{};
    for (final sid in sentimentTotals.keys) {
      final cnt = sentimentCounts[sid] ?? 1;
      sentiments[sid] = (sentimentTotals[sid] ?? 0) / cnt;
    }

    setState(() {
      _sourceArticleCount = counts;
      _sourceSentiment = sentiments;
    });
  }

  // All sources from DB + articles per source
  List<_SourceStat> get _sourceStats {
    final map = <String, _SourceStat>{};

    // Start with ALL sources from the database
    for (final src in _allSources) {
      map[src.id] = _SourceStat(
        sourceId: src.id,
        name: src.name,
        slug: src.slug,
        ideology: src.ideology,
        articles: [],
        articleCount: 0,
      );
    }

    // Merge article data from stories
    for (final story in _allStories) {
      for (final article in story.previewArticles) {
        if (map.containsKey(article.sourceId)) {
          map[article.sourceId]!.articles.add(story);
        }
      }
    }

    // Finalize article counts
    for (final stat in map.values) {
      stat.articleCount = stat.articles.length;
    }

    final list = map.values.toList();
    list.sort((a, b) => b.articleCount.compareTo(a.articleCount));
    return list;
  }

  List<Story> get _filteredStories {
    if (_selectedSource == 'all') return _allStories;
    return _allStories.where((s) =>
      s.previewArticles.any((a) => a.sourceId == _selectedSource)
    ).toList();
  }

  String _sourceLabel(Source s) {
    final names = {
      'g1': 'G1', 'folha': 'Folha', 'uol': 'UOL', 'estadao': 'Estadão',
      'oglobo': 'O Globo', 'bbc': 'BBC', 'cnn': 'CNN', 'metropoles': 'Metrópolis',
      'icl': 'ICL', 'reuters': 'Reuters', 'aljazeera': 'Al Jazeera',
      'france24': 'France 24', 'dw': 'DW', 'rte': 'RTÉ', 'nbc': 'NBC',
      'ap': 'AP News',
    };
    return names[s.slug] ?? s.name;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : Column(
                children: [
                  _buildHeader(),
                  TabBar(
                    controller: _tabController,
                    indicatorColor: AppTheme.primary,
                    labelColor: AppTheme.primary,
                    unselectedLabelColor: AppTheme.textoSec,
                    tabs: const [
                      Tab(text: '📰 Fontes', height: 40),
                      Tab(text: '📊 Radar', height: 40),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildSourcesTab(),
                        _buildRadarTab(),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildHeader() {
    final totalStories = _allStories.length;
    final totalArticles = _allStories.fold<int>(0, (sum, s) => sum + s.articleCount);
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.analytics, color: AppTheme.primary, size: 22),
              const SizedBox(width: 8),
              const Text('📊 Análise', style: TextStyle(
                color: AppTheme.texto, fontSize: 18, fontWeight: FontWeight.bold,
              )),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.refresh, color: AppTheme.textoSec, size: 20),
                onPressed: _loadData,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _kpiCard('📰', '$totalArticles', 'Artigos'),
              const SizedBox(width: 8),
              _kpiCard('📌', '$totalStories', 'Stories'),
              const SizedBox(width: 8),
              _kpiCard('🌐', '${_allSources.length}', 'Fontes'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _kpiCard(String emoji, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(
              color: AppTheme.texto, fontSize: 18, fontWeight: FontWeight.bold,
            )),
            Text(label, style: const TextStyle(
              color: AppTheme.textoSec, fontSize: 10,
            )),
          ],
        ),
      ),
    );
  }

  // ---- SOURCES TAB ----

  Widget _buildSourcesTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _biasSpectrumBar(),
        const SizedBox(height: 20),

        const Text('🏆 Ranking por Volume', style: TextStyle(
          color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
        )),
        const SizedBox(height: 8),
        ..._sourceStats.take(16).map((s) => _sourceRankCard(s)),

        const SizedBox(height: 20),

        const Text('😊 Sentimento Médio por Fonte', style: TextStyle(
          color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
        )),
        const SizedBox(height: 8),
        _sentimentChart(),

        const SizedBox(height: 20),

        const Text('🌍 Mídia Estrangeira', style: TextStyle(
          color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
        )),
        const SizedBox(height: 8),
        ...ForeignSource.all.map((s) => _foreignSourceCard(s)),

        const SizedBox(height: 80),
      ],
    );
  }

  Widget _biasSpectrumBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('⚖️ Espectro de Viés', style: TextStyle(
            color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
          )),
          const SizedBox(height: 12),
          Container(
            height: 12,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [
                Color(0xFF4CAF50), Color(0xFF8BC34A),
                Color(0xFF9E9E9E), Color(0xFFFF9800), Color(0xFFF44336),
              ]),
              borderRadius: BorderRadius.circular(6),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _biasLabel('⬅️ Esq.', const Color(0xFF4CAF50)),
              _biasLabel('Centro-Esq.', const Color(0xFF8BC34A)),
              _biasLabel('Centro', const Color(0xFF9E9E9E)),
              _biasLabel('Centro-Dir.', const Color(0xFFFF9800)),
              _biasLabel('Dir. ➡️', const Color(0xFFF44336)),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text(
              'Posicionamento editorial auto-declarado ou inferido por cobertura.',
              style: TextStyle(color: AppTheme.textoSec, fontSize: 10),
            ),
          ),
        ],
      ),
    );
  }

  Widget _biasLabel(String text, Color color) {
    return Text(text, style: TextStyle(color: color, fontSize: 9));
  }

  Widget _sourceRankCard(_SourceStat s) {
    final count = s.articleCount;
    final sentiment = _sourceSentiment[s.sourceId] ?? 0;
    final maxCount = _sourceStats.isNotEmpty && _sourceStats.first.articleCount > 0
        ? _sourceStats.first.articleCount : 1;
    final barWidth = maxCount > 0 ? (count / maxCount).clamp(0.0, 1.0) : 0.0;

    return GestureDetector(
      onTap: () => _showSourceDetail(s),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 90,
              child: Text(s.name, style: const TextStyle(
                color: AppTheme.texto, fontSize: 12, fontWeight: FontWeight.w600,
              )),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Stack(
                children: [
                  Container(
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  FractionallySizedBox(
                    widthFactor: barWidth,
                    child: Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: count > 0 ? AppTheme.primary : AppTheme.surface,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: count > 0
                    ? AppTheme.primary.withValues(alpha: 0.15)
                    : AppTheme.surface,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: count > 0 ? AppTheme.primary : AppTheme.textoSec,
                  fontSize: 12, fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 6),
            _sentimentIcon(sentiment),
            const SizedBox(width: 4),
            Icon(_biasIcon(s.ideology), color: _biasColor(s.ideology), size: 12),
          ],
        ),
      ),
    );
  }

  Widget _sentimentIcon(double sentiment) {
    if (sentiment > 0.3) return const Text('😊', style: TextStyle(fontSize: 12));
    if (sentiment < -0.3) return const Text('😟', style: TextStyle(fontSize: 12));
    return const Text('😐', style: TextStyle(fontSize: 12));
  }

  Widget _sentimentChart() {
    final stats = _sourceStats.where((s) => s.articleCount > 0).take(8).toList();
    if (stats.isEmpty) return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Text('Nenhum dado de sentimento disponível',
          style: TextStyle(color: AppTheme.textoSec, fontSize: 12)),
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: SizedBox(
        height: 120,
        child: BarChart(
          BarChartData(
            alignment: BarChartAlignment.spaceAround,
            maxY: 1,
            minY: -1,
            barTouchData: BarTouchData(enabled: false),
            titlesData: FlTitlesData(
              show: true,
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (value, _) {
                    final idx = value.toInt();
                    if (idx >= 0 && idx < stats.length) {
                      return Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          stats[idx].name.substring(0, stats[idx].name.length.clamp(0, 3)),
                          style: const TextStyle(color: AppTheme.textoSec, fontSize: 9),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                  reservedSize: 28,
                ),
              ),
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (value, _) {
                    if (value == 1) return const Text('😊', style: TextStyle(fontSize: 10));
                    if (value == -1) return const Text('😟', style: TextStyle(fontSize: 10));
                    return const SizedBox.shrink();
                  },
                  reservedSize: 20,
                ),
              ),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            gridData: FlGridData(
              show: true,
              horizontalInterval: 1,
              getDrawingHorizontalLine: (value) => FlLine(
                color: AppTheme.surface, strokeWidth: 0.5,
              ),
              drawVerticalLine: false,
            ),
            borderData: FlBorderData(show: false),
            barGroups: stats.asMap().entries.map((e) {
              final sentiment = _sourceSentiment[e.value.sourceId] ?? 0;
              return BarChartGroupData(
                x: e.key,
                barRods: [
                  BarChartRodData(
                    toY: sentiment,
                    color: sentiment > 0 ? Colors.green
                        : sentiment < 0 ? Colors.red : Colors.grey,
                    width: 16,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  // ---- RADAR TAB ----

  Widget _buildRadarTab() {
    return Column(
      children: [
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            children: [
              _filterChip('all', '🌐 Todas ${_allStories.length}'),
              ..._sourceStats.where((s) => s.articleCount > 0).take(10)
                  .map((s) => _filterChip(s.sourceId, '${s.name} (${s.articleCount})')),
            ],
          ),
        ),
        const Divider(color: AppTheme.surface, height: 1),
        Expanded(
          child: _filteredStories.isEmpty
              ? const Center(child: Text('Nenhuma story encontrada',
                  style: TextStyle(color: AppTheme.textoSec)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _filteredStories.length,
                  itemBuilder: (context, i) => _radarStoryItem(_filteredStories[i]),
                ),
        ),
      ],
    );
  }

  Widget _filterChip(String id, String label) {
    final selected = _selectedSource == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _selectedSource = id),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? AppTheme.primary : AppTheme.card,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(label, style: TextStyle(
            color: selected ? Colors.white : AppTheme.textoSec,
            fontSize: 12,
          )),
        ),
      ),
    );
  }

  Widget _radarStoryItem(Story story) {
    final sourceIds = story.previewArticles.map((a) => a.sourceId).toSet();
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _cycleBadge(story.cycle),
              const Spacer(),
              Text('${story.previewArticles.length} arts', style: const TextStyle(
                color: AppTheme.textoSec, fontSize: 10,
              )),
            ],
          ),
          const SizedBox(height: 6),
          Text(story.title, style: const TextStyle(
            color: AppTheme.texto, fontSize: 12, fontWeight: FontWeight.w600,
          ), maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 6),
          Wrap(
            spacing: 4,
            runSpacing: 4,
            children: sourceIds.map((sid) {
              final src = _sourceStats.where((s) => s.sourceId == sid).firstOrNull;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(src?.name ?? sid, style: const TextStyle(
                  color: AppTheme.primary, fontSize: 9, fontWeight: FontWeight.w600,
                )),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _cycleBadge(String cycle) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    decoration: BoxDecoration(
      color: _cycleColor(cycle).withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(4),
    ),
    child: Text(_cycleEmoji(cycle), style: const TextStyle(fontSize: 10)),
  );

  Color _cycleColor(String cycle) {
    const colors = {
      'conflito': Colors.red, 'economico': Colors.amber, 'politico': Colors.blue,
      'social': Colors.green, 'tecnologico': Colors.purple, 'ambiental': Colors.teal,
      'cultural': Colors.orange,
    };
    return colors[cycle] ?? AppTheme.primary;
  }

  String _cycleEmoji(String cycle) {
    const map = {'conflito': '⚔️', 'economico': '📊', 'politico': '🏛️', 'social': '👥',
      'tecnologico': '⚡', 'ambiental': '🌱', 'cultural': '🎭'};
    return map[cycle] ?? '📰';
  }

  // ---- SOURCE DETAIL MODAL ----

  void _showSourceDetail(_SourceStat s) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bg,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (_, controller) => _sourceDetailSheet(s, controller),
      ),
    );
  }

  Widget _sourceDetailSheet(_SourceStat s, ScrollController controller) {
    final sentiment = _sourceSentiment[s.sourceId] ?? 0;
    final topics = <String, int>{};
    for (final story in s.articles) {
      topics[story.cycle] = (topics[story.cycle] ?? 0) + 1;
    }
    final topTopics = topics.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Container(
      padding: const EdgeInsets.all(16),
      child: ListView(
        controller: controller,
        children: [
          Center(
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: AppTheme.surface, borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_sourceSentimentEmoji(sentiment), style: const TextStyle(fontSize: 24)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.name, style: const TextStyle(
                      color: AppTheme.texto, fontSize: 18, fontWeight: FontWeight.bold,
                    )),
                    Text('${s.articleCount} artigos nas últimas stories', style: const TextStyle(
                      color: AppTheme.textoSec, fontSize: 12,
                    )),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: _biasColor(s.ideology).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_ideologyLabel(s.ideology), style: TextStyle(
                  color: _biasColor(s.ideology), fontSize: 11, fontWeight: FontWeight.w600,
                )),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Sentiment gauge
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('😊 Sentimento Médio', style: TextStyle(
                  color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
                )),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('😟', style: TextStyle(fontSize: 20)),
                    Expanded(
                      child: Container(
                        height: 12,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [
                            Colors.red.withValues(alpha: 0.7), Colors.grey, Colors.green.withValues(alpha: 0.7),
                          ]),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ),
                    const Text('😊', style: TextStyle(fontSize: 20)),
                  ],
                ),
                const SizedBox(height: 8),
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: _sentimentColor(sentiment).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_sentimentDesc(sentiment), style: TextStyle(
                      color: _sentimentColor(sentiment), fontSize: 12,
                    )),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Ideology
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('⚖️ Posicionamento Editorial', style: TextStyle(
                  color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
                )),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('⬅️', style: TextStyle(fontSize: 16)),
                    Expanded(
                      child: Container(
                        height: 8,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [
                            Color(0xFF4CAF50), Color(0xFF8BC34A),
                            Color(0xFF9E9E9E), Color(0xFFFF9800), Color(0xFFF44336),
                          ]),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    const Text('➡️', style: TextStyle(fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 8),
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: _biasColor(s.ideology).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_ideologyLabel(s.ideology), style: TextStyle(
                      color: _biasColor(s.ideology), fontSize: 12, fontWeight: FontWeight.w600,
                    )),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Topics covered
          if (topTopics.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('🏷️ Ciclos Cobertos', style: TextStyle(
                    color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
                  )),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: topTopics.map((e) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _cycleColor(e.key).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_cycleEmoji(e.key), style: const TextStyle(fontSize: 12)),
                          const SizedBox(width: 4),
                          Text('${e.value}', style: TextStyle(
                            color: _cycleColor(e.key), fontSize: 12, fontWeight: FontWeight.bold,
                          )),
                        ],
                      ),
                    )).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Articles
          const Text('📰 Artigos Recentes', style: TextStyle(
            color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
          )),
          const SizedBox(height: 8),
          if (s.articles.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text('Nenhum artigo encontrado para esta fonte nas últimas stories.',
                  style: TextStyle(color: AppTheme.textoSec, fontSize: 12)),
            )
          else
            ...s.articles.take(20).map((story) {
              final article = story.previewArticles.firstWhere(
                (a) => a.sourceId == s.sourceId, orElse: () => story.previewArticles.first,
              );
              return _detailArticleItem(story, article);
            }),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _detailArticleItem(Story story, dynamic article) {
    return GestureDetector(
      onTap: () async {
        final url = article.url as String?;
        if (url != null && url.isNotEmpty) {
          final uri = Uri.parse(url);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _cycleBadge(story.cycle),
                const Spacer(),
                const Icon(Icons.open_in_new, color: AppTheme.textoSec, size: 14),
              ],
            ),
            const SizedBox(height: 6),
            Text(story.title, style: const TextStyle(
              color: AppTheme.texto, fontSize: 12,
            ), maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(_timeAgo(story.updatedAt), style: const TextStyle(
              color: AppTheme.textoSec, fontSize: 10,
            )),
          ],
        ),
      ),
    );
  }

  Widget _foreignSourceCard(ForeignSource src) {
    return GestureDetector(
      onTap: () async {
        final uri = Uri.tryParse(src.url);
        if (uri != null) {
          try { await launchUrl(uri, mode: LaunchMode.externalApplication); } catch (_) {}
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            const Text('🌐', style: TextStyle(fontSize: 18)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(src.name, style: const TextStyle(
                    color: AppTheme.texto, fontSize: 12, fontWeight: FontWeight.w600,
                  )),
                  Text(src.url.replaceFirst('https://', '').replaceFirst('http://', ''),
                      style: const TextStyle(color: AppTheme.textoSec, fontSize: 10),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(src.language, style: const TextStyle(
                color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.w600,
              )),
            ),
          ],
        ),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m atrás';
    if (diff.inHours < 24) return '${diff.inHours}h atrás';
    return '${diff.inDays}d atrás';
  }

  String _sourceSentimentEmoji(double s) {
    if (s > 0.3) return '😊';
    if (s < -0.3) return '😟';
    return '😐';
  }

  String _ideologyLabel(String ideology) {
    switch (ideology) {
      case 'esquerda': return 'Esquerda';
      case 'centro-esquerda': return 'Centro-Esq.';
      case 'centro': return 'Centro';
      case 'centro-direita': return 'Centro-Dir.';
      case 'direita': return 'Direita';
      case 'indefinido': return 'Indefinido';
      default: return ideology;
    }
  }

  String _sentimentDesc(double s) {
    if (s > 0.5) return 'Tom predominantemente positivo';
    if (s > 0.2) return 'Levemente positivo';
    if (s > -0.2) return 'Neutro / equilibrado';
    if (s > -0.5) return 'Levemente negativo';
    return 'Tom predominantemente negativo';
  }

  Color _sentimentColor(double s) {
    if (s > 0.2) return Colors.green;
    if (s < -0.2) return Colors.red;
    return Colors.grey;
  }

  Color _biasColor(String ideology) {
    switch (ideology) {
      case 'esquerda': return const Color(0xFF4CAF50);
      case 'centro-esquerda': return const Color(0xFF8BC34A);
      case 'centro': return const Color(0xFF9E9E9E);
      case 'centro-direita': return const Color(0xFFFF9800);
      case 'direita': return const Color(0xFFF44336);
      default: return AppTheme.textoSec;
    }
  }

  IconData _biasIcon(String ideology) {
    switch (ideology) {
      case 'esquerda': return Icons.arrow_back;
      case 'centro-esquerda': return Icons.arrow_back;
      case 'centro': return Icons.remove;
      case 'centro-direita': return Icons.arrow_forward;
      case 'direita': return Icons.arrow_forward;
      default: return Icons.help_outline;
    }
  }
}

class _SourceStat {
  final String sourceId;
  final String name;
  final String slug;
  final String ideology;
  final List<Story> articles;
  int articleCount;
  _SourceStat({
    required this.sourceId,
    required this.name,
    required this.slug,
    required this.ideology,
    required this.articles,
    required this.articleCount,
  });
}
