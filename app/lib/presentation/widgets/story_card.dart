import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';

class StoryCard extends StatelessWidget {
  final Story story;
  final VoidCallback? onTap;

  const StoryCard({super.key, required this.story, this.onTap});

  Color _cycleColor(String cycle) {
    switch (cycle) {
      case 'conflito': return AppTheme.alerta;
      case 'economico': return AppTheme.warning;
      case 'politico': return AppTheme.primary;
      case 'social': return AppTheme.sucesso;
      case 'tecnologico': return Colors.blue;
      case 'ambiental': return Colors.green;
      case 'cultural': return Colors.orange;
      default: return AppTheme.textoSec;
    }
  }

  String get _regionEmoji {
    switch (story.region?.toUpperCase()) {
      case 'SAM': return '🌎';
      case 'NAM': return '🌍';
      case 'EUR': return '🏰';
      case 'ASI': return '🥮';
      case 'MID': return '🕌';
      case 'AFR': return '🌍';
      case 'OCE': return '🏝️';
      default: return '🌐';
    }
  }

  IconData get _sentimentIcon {
    switch (story.sentimentTrend) {
      case 'rising': return Icons.trending_up;
      case 'falling': return Icons.trending_down;
      default: return Icons.trending_flat;
    }
  }

  Color get _sentimentColor {
    switch (story.sentimentTrend) {
      case 'rising': return AppTheme.sucesso;
      case 'falling': return AppTheme.alerta;
      default: return AppTheme.textoSec;
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasSummary = story.summary != null && story.summary!.isNotEmpty;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _cycleColor(story.cycle).withValues(alpha: 0.2),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
              child: Row(
                children: [
                  // Cycle badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _cycleColor(story.cycle).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      story.cycle.toUpperCase(),
                      style: TextStyle(
                        color: _cycleColor(story.cycle),
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  // Region badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_regionEmoji, style: const TextStyle(fontSize: 11)),
                        const SizedBox(width: 3),
                        Text(
                          story.region ?? '?',
                          style: const TextStyle(
                            color: AppTheme.textoSec,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  // Sentiment
                  Icon(_sentimentIcon, color: _sentimentColor, size: 18),
                  const SizedBox(width: 8),
                  // Article count
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.rss_feed, color: AppTheme.textoSec, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          '${story.articleCount}',
                          style: const TextStyle(
                            color: AppTheme.textoSec,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Title
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
              child: Text(
                story.title,
                style: const TextStyle(
                  color: AppTheme.texto,
                  fontSize: 15,
                  height: 1.3,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

            // Summary or placeholder
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 6, 14, 0),
              child: Text(
                hasSummary ? story.summary! : '⏳ Aguardando análise automática…',
                style: TextStyle(
                  color: hasSummary ? AppTheme.textoSec : AppTheme.textoSec.withValues(alpha: 0.5),
                  fontSize: 13,
                  fontStyle: hasSummary ? FontStyle.normal : FontStyle.italic,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              child: Row(
                children: [
                  // Hotness
                  if (story.hotness > 0) ...[
                    Icon(Icons.local_fire_department, color: Colors.orange.shade700, size: 14),
                    const SizedBox(width: 3),
                    Text(
                      '${story.hotness}',
                      style: TextStyle(color: Colors.orange.shade700, fontSize: 12),
                    ),
                    const SizedBox(width: 12),
                  ],
                  const Spacer(),
                  Text(
                    _timeAgo(story.updatedAt),
                    style: const TextStyle(color: AppTheme.textoSec, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inHours < 1) return '${diff.inMinutes}m atrás';
    if (diff.inHours < 24) return '${diff.inHours}h atrás';
    return '${diff.inDays}d atrás';
  }
}