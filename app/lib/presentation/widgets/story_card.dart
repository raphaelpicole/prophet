import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';
import '../screens/story_detail_screen.dart';
import 'animated_button.dart';

class StoryCard extends StatefulWidget {
  final Story story;
  final VoidCallback? onTap;

  const StoryCard({super.key, required this.story, this.onTap});

  @override
  State<StoryCard> createState() => _StoryCardState();
}

class _StoryCardState extends State<StoryCard>
    with SingleTickerProviderStateMixin {
  bool _expanded = false;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    if (widget.story.hotness > 50) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

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

  // regionEmoji replaced by _regionIcon
  @deprecated
  String get _regionEmoji {
    switch (widget.story.region?.toUpperCase()) {
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
    switch (widget.story.sentimentTrend) {
      case 'rising': return Icons.trending_up;
      case 'falling': return Icons.trending_down;
      default: return Icons.trending_flat;
    }
  }

  Color get _sentimentColor {
    switch (widget.story.sentimentTrend) {
      case 'rising': return AppTheme.sucesso;
      case 'falling': return AppTheme.alerta;
      default: return AppTheme.textoSec;
    }
  }

  IconData get _regionIcon {
    switch (widget.story.region?.toUpperCase()) {
      case 'SAM': return Icons.public;
      case 'NAM': return Icons.location_city;
      case 'EUR': return Icons.castle;
      case 'ASI': return Icons.temple_buddhist;
      case 'MID': return Icons.mosque;
      case 'AFR': return Icons.south_america;
      case 'OCE': return Icons.beach_access;
      default: return Icons.public;
    }
  }

  bool get _isWeb {
    return identical(1, 1);
  }

  bool get _showArticlePreview {
    return _isWeb && widget.story.previewArticles.isNotEmpty;
  }

  void _onExpandTap() {
    setState(() => _expanded = !_expanded);
  }

  void _onCardTap() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => StoryDetailScreen(story: widget.story),
      ),
    );
  }

  String _sourceLabel(String sourceId) {
    final map = {
      'g1': '🔵 Fonte A', 'folha': '📰 Fonte B', 'uol': '🌐 Fonte C',
      'estadao': '📊 Fonte D', 'oglobo': '🌍 Fonte E', 'cnn': '📺 Fonte F',
      'bbc': '📡 Fonte G', 'metropoles': '🏙️ Fonte H',
    };
    return map[sourceId] ?? sourceId.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final hasSummary = widget.story.summary != null && widget.story.summary!.isNotEmpty;
    final story = widget.story;
    final cycleColor = _cycleColor(story.cycle);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AnimatedButton(
        onTap: _showArticlePreview ? _onExpandTap : _onCardTap,
        onLongPress: widget.onTap,
        scaleOnPress: 0.98,
        duration: const Duration(milliseconds: 150),
        padding: EdgeInsets.zero,
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: cycleColor.withValues(alpha: _expanded ? 0.4 : 0.15),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: cycleColor.withValues(alpha: 0.06),
              blurRadius: 12,
              spreadRadius: 0,
              offset: const Offset(0, 2),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Gradient header bar
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(15),
              topRight: Radius.circular(15),
            ),
            child: Container(
              height: 3,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    cycleColor.withValues(alpha: 0.8),
                    cycleColor.withValues(alpha: 0.3),
                    cycleColor.withValues(alpha: 0.0),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
              ),
            ),
          ),

          // Header row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: cycleColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: cycleColor.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    story.cycle.toUpperCase(),
                    style: TextStyle(
                      color: cycleColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.surface.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_regionIcon, color: AppTheme.textoSec, size: 12),
                      const SizedBox(width: 4),
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
                if (_showArticlePreview)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _expanded ? Icons.expand_less : Icons.expand_more,
                          color: AppTheme.primary,
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${story.previewArticles.length} artigos',
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  )
                else ...[
                  Icon(_sentimentIcon, color: _sentimentColor, size: 16),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.surface.withValues(alpha: 0.5),
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
              ],
            ),
          ),

          // Title - maior destaque
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Text(
              story.title,
              style: const TextStyle(
                color: AppTheme.texto,
                fontSize: 16,
                height: 1.35,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),

          // Summary
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Text(
              hasSummary ? story.summary! : 'Aguardando análise automática...',
              style: TextStyle(
                color: hasSummary
                    ? AppTheme.textoSec
                    : AppTheme.textoSec.withValues(alpha: 0.5),
                fontSize: 13,
                height: 1.45,
                fontStyle: hasSummary ? FontStyle.normal : FontStyle.italic,
              ),
              maxLines: _expanded ? 100 : 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          // Article previews (web only, expanded)
          if (_showArticlePreview && _expanded) ...[
            const SizedBox(height: 12),
            Divider(
              color: AppTheme.surface.withValues(alpha: 0.5),
              height: 1,
              indent: 16,
              endIndent: 16,
            ),
            ...story.previewArticles.map((article) => _articlePreviewItem(article)),
          ],

          // Footer com hotness badge
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Row(
              children: [
                if (story.hotness > 0) ...[
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: story.hotness > 50
                              ? Colors.orange.withValues(
                                  alpha: 0.08 + (_pulseController.value * 0.08),
                                )
                              : AppTheme.surface.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(8),
                          border: story.hotness > 50
                              ? Border.all(
                                  color: Colors.orange.withValues(
                                    alpha: 0.3 + (_pulseController.value * 0.3),
                                  ),
                                  width: 1,
                                )
                              : null,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.local_fire_department,
                              color: story.hotness > 50
                                  ? Colors.orange.shade400
                                  : Colors.orange.shade700,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${story.hotness}',
                              style: TextStyle(
                                color: story.hotness > 50
                                    ? Colors.orange.shade300
                                    : Colors.orange.shade600,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                ],
                const Spacer(),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.schedule, color: AppTheme.textoSec, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      _timeAgo(story.updatedAt),
                      style: const TextStyle(
                        color: AppTheme.textoSec,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                if (_showArticlePreview) ...[
                  const SizedBox(width: 8),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    color: AppTheme.textoSec,
                    size: 16,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    ),
  );
  }

  Widget _articlePreviewItem(PreviewArticle article) {
    return InkWell(
      onTap: () {
        final storyWithArticle = Story(
          id: widget.story.id,
          title: widget.story.title,
          summary: widget.story.summary,
          mainSubject: widget.story.mainSubject,
          cycle: widget.story.cycle,
          sentimentTrend: widget.story.sentimentTrend,
          hotness: widget.story.hotness,
          articleCount: widget.story.articleCount,
          updatedAt: widget.story.updatedAt,
          region: widget.story.region,
          previewArticles: widget.story.previewArticles,
          prediction: widget.story.prediction,
          selectedArticle: article,
        );
        Navigator.pushNamed(context, '/article', arguments: storyWithArticle);
      },
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppTheme.surface, width: 0.5),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 6,
              height: 6,
              margin: const EdgeInsets.only(top: 5, right: 10),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    article.title,
                    style: const TextStyle(
                      color: AppTheme.texto,
                      fontSize: 12,
                      height: 1.35,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _sourceLabel(article.sourceId),
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.schedule, color: AppTheme.textoSec, size: 10),
                          const SizedBox(width: 3),
                          Text(
                            _timeAgo(article.publishedAt),
                            style: const TextStyle(
                              color: AppTheme.textoSec,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ],
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
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}
