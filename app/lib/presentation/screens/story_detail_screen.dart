import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';

class StoryDetailScreen extends StatelessWidget {
  final Story story;

  const StoryDetailScreen({super.key, required this.story});

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
          story.cycle.toUpperCase(),
          style: const TextStyle(
            color: AppTheme.textoSec,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: AppTheme.textoSec, size: 20),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Título
            Text(
              story.title,
              style: const TextStyle(
                color: AppTheme.texto,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            // Metadados
            Row(
              children: [
                _tag(story.cycle, _cycleColor(story.cycle)),
                const SizedBox(width: 8),
                _trendTag(story.sentimentTrend),
                const Spacer(),
                Icon(
                  Icons.article_outlined,
                  color: AppTheme.textoSec,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  '${story.articleCount} artigos',
                  style: const TextStyle(color: AppTheme.textoSec, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Descrição / Summary
            if (story.summary != null) ...[
              Text(
                story.summary!,
                style: const TextStyle(color: AppTheme.textoSec, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 20),
            ],

            // KPIs
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _kpi('🔥', '${story.hotness}', '热度'),
                  _kpi('📰', '${story.articleCount}', 'Artigos'),
                  _kpi('🕐', _timeAgo(story.updatedAt), 'Atualizado'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Artigos
            const Text('📰 Artigos', style: TextStyle(
              color: AppTheme.texto,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            )),
            const SizedBox(height: 12),
            _articlePlaceholder(),
          ],
        ),
      ),
    );
  }

  Widget _tag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _trendTag(String trend) {
    final color = trend == 'rising'
        ? AppTheme.sucesso
        : trend == 'falling'
            ? AppTheme.alerta
            : AppTheme.textoSec;
    final icon = trend == 'rising'
        ? Icons.trending_up
        : trend == 'falling'
            ? Icons.trending_down
            : Icons.trending_flat;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 4),
          Text(
            trend == 'rising'
                ? 'Subindo'
                : trend == 'falling'
                    ? 'Caidndo'
                    : 'Estável',
            style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _kpi(String icon, String value, String label) {
    return Column(
      children: [
        Text(icon, style: const TextStyle(fontSize: 20)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(
          color: AppTheme.texto,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        )),
        Text(label, style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
      ],
    );
  }

  Widget _articlePlaceholder() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Column(
        children: [
          Icon(Icons.article_outlined, color: AppTheme.textoSec, size: 32),
          SizedBox(height: 8),
          Text(
            'Endpoint de artigos da story\nem desenvolvimento',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textoSec, fontSize: 13),
          ),
        ],
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
}
