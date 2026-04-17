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
      default: return AppTheme.textoSec;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
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
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _cycleColor(story.cycle).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    story.cycle.toUpperCase(),
                    style: TextStyle(
                      color: _cycleColor(story.cycle),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                Icon(
                  story.sentimentTrend == 'rising'
                      ? Icons.trending_up
                      : story.sentimentTrend == 'falling'
                          ? Icons.trending_down
                          : Icons.trending_flat,
                  color: story.sentimentTrend == 'rising'
                      ? AppTheme.sucesso
                      : story.sentimentTrend == 'falling'
                          ? AppTheme.alerta
                          : AppTheme.textoSec,
                  size: 18,
                ),
                const SizedBox(width: 4),
                Text(
                  '${story.articleCount} artigos',
                  style: const TextStyle(color: AppTheme.textoSec, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              story.title,
              style: const TextStyle(
                color: AppTheme.texto,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (story.summary != null) ...[
              const SizedBox(height: 4),
              Text(
                story.summary!,
                style: const TextStyle(color: AppTheme.textoSec, fontSize: 13),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.local_fire_department, color: Colors.orange, size: 14),
                const SizedBox(width: 4),
                Text(
                  '🔥 ${story.hotness}',
                  style: const TextStyle(color: AppTheme.textoSec, fontSize: 12),
                ),
                const Spacer(),
                Text(
                  _timeAgo(story.updatedAt),
                  style: const TextStyle(color: AppTheme.textoSec, fontSize: 12),
                ),
              ],
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
