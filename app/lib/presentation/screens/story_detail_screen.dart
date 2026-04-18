import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';
import '../../data/services/api_service.dart';

class StoryDetailScreen extends StatefulWidget {
  final Story story;
  const StoryDetailScreen({super.key, required this.story});

  @override
  State<StoryDetailScreen> createState() => _StoryDetailScreenState();
}

class _StoryDetailScreenState extends State<StoryDetailScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _articles = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadArticles();
  }

  Future<void> _loadArticles() async {
    try {
      final data = await _api.getStoryDetail(widget.story.id);
      if (mounted) setState(() { _articles = data['articles'] ?? []; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.texto),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.story.cycle.toUpperCase(),
          style: const TextStyle(color: AppTheme.textoSec, fontSize: 13, fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.share, color: AppTheme.textoSec, size: 20), onPressed: _shareStory),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.story.title, style: const TextStyle(
              color: AppTheme.texto, fontSize: 22, fontWeight: FontWeight.bold,
            )),
            const SizedBox(height: 16),
            Row(children: [
              _tag(widget.story.cycle, _cycleColor(widget.story.cycle)),
              const SizedBox(width: 8),
              _trendTag(widget.story.sentimentTrend),
              const Spacer(),
              Icon(Icons.article_outlined, color: AppTheme.textoSec, size: 16),
              const SizedBox(width: 4),
              Text('${widget.story.articleCount} artigos', style: const TextStyle(color: AppTheme.textoSec, fontSize: 13)),
            ]),
            const SizedBox(height: 20),
            if (widget.story.summary != null) ...[
              Text(widget.story.summary!, style: const TextStyle(color: AppTheme.textoSec, fontSize: 14, height: 1.5)),
              const SizedBox(height: 20),
            ],
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _kpi('🔥', '${widget.story.hotness}', '热度'),
                  _kpi('📰', '${widget.story.articleCount}', 'Artigos'),
                  _kpi('🕐', _timeAgo(widget.story.updatedAt), 'Atualizado'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Sentiment timeline chart
            _sentimentTimeline(),

            const SizedBox(height: 24),
            const Text('📰 Artigos', style: TextStyle(color: AppTheme.texto, fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            if (_loading)
              const Center(child: Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2),
              ))
            else if (_articles.isEmpty)
              _emptyState()
            else
              ...(_articles.map((a) => _articleCard(a))),
          ],
        ),
      ),
    );
  }

  Widget _articleCard(dynamic a) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(10)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(a['title'] ?? 'Sem título', style: const TextStyle(color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(a['source_name'] ?? a['source_slug'] ?? '—', style: const TextStyle(color: AppTheme.primary, fontSize: 11)),
              const Spacer(),
              Text(_timeAgo(DateTime.tryParse(a['published_at'] ?? '') ?? DateTime.now()), style: const TextStyle(color: AppTheme.textoSec, fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _emptyState() => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
    child: const Center(child: Text('Nenhum artigo encontrado', style: TextStyle(color: AppTheme.textoSec, fontSize: 13))),
  );

  Widget _tag(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: color.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6)),
    child: Text(label.toUpperCase(), style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
  );

  Widget _trendTag(String trend) {
    final color = trend == 'rising' ? AppTheme.sucesso : trend == 'falling' ? AppTheme.alerta : AppTheme.textoSec;
    final label = trend == 'rising' ? 'Subindo' : trend == 'falling' ? 'Caidndo' : 'Estável';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(trend == 'rising' ? Icons.trending_up : trend == 'falling' ? Icons.trending_down : Icons.trending_flat, color: color, size: 14),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _kpi(String icon, String value, String label) => Column(children: [
    Text(icon, style: const TextStyle(fontSize: 20)),
    const SizedBox(height: 4),
    Text(value, style: const TextStyle(color: AppTheme.texto, fontSize: 18, fontWeight: FontWeight.bold)),
    Text(label, style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
  ]);

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

  Future<void> _shareStory() async {
    final url = Uri.parse('https://twitter.com/intent/tweet?text=${Uri.encodeComponent(widget.story.title)}&url=${Uri.encodeComponent("https://prophet-olive.vercel.app")}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Widget _sentimentTimeline() {
    // Mock data simulating sentiment trend over last 7 days
    final spots = [
      FlSpot(0, 0.3), FlSpot(1, 0.5), FlSpot(2, 0.4),
      FlSpot(3, 0.7), FlSpot(4, 0.6), FlSpot(5, 0.8), FlSpot(6, 0.9),
    ];
    final labels = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Agora'];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('📈 Tendência de Sentimento', style: TextStyle(color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 1,
                      getTitlesWidget: (v, meta) => Text(labels[v.toInt()] ?? '', style: const TextStyle(color: AppTheme.textoSec, fontSize: 9)),
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: AppTheme.primary,
                    barWidth: 3,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppTheme.primary.withValues(alpha: 0.15),
                    ),
                  ),
                ],
                minY: 0,
                maxY: 1,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _legend('😰 Negativo', AppTheme.alerta),
              _legend('😐 Neutro', AppTheme.textoSec),
              _legend('😊 Positivo', AppTheme.sucesso),
            ],
          ),
        ],
      ),
    );
  }

  Widget _legend(String label, Color color) => Row(
    children: [
      Container(width: 8, height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(color: AppTheme.textoSec, fontSize: 10)),
    ],
  );

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}