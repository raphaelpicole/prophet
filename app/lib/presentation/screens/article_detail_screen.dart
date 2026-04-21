import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';

class ArticleDetailScreen extends StatelessWidget {
  final Story story;

  const ArticleDetailScreen({super.key, required this.story});

  // Article selecionado (pode ser null - mostra análise da story)
  PreviewArticle? get article => story.selectedArticle;

  @override
  Widget build(BuildContext context) {
    // Se tem artigo selecionado, mostra dele. Senão, mostra análise da story.
    final hasArticle = article != null;
    final displayTitle = hasArticle ? article!.title : story.title;
    final displaySource = hasArticle ? article!.sourceId : null;
    final displayDate = hasArticle ? article!.publishedAt : story.updatedAt;
    final displayUrl = hasArticle ? article!.url : null;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: CustomScrollView(
        slivers: [
          // AppBar
          SliverAppBar(
            backgroundColor: AppTheme.bg,
            foregroundColor: AppTheme.texto,
            elevation: 0,
            pinned: true,
            expandedHeight: 120,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppTheme.primary.withValues(alpha: 0.3),
                      AppTheme.bg,
                    ],
                  ),
                ),
              ),
              title: Text(
                hasArticle ? 'Artigo' : 'Análise da Story',
                style: const TextStyle(
                  color: AppTheme.texto,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              centerTitle: true,
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              if (displayUrl != null)
                IconButton(
                  icon: const Icon(Icons.open_in_browser, size: 20, color: AppTheme.texto),
                  onPressed: () => _openUrl(displayUrl),
                ),
              IconButton(
                icon: const Icon(Icons.share, size: 20, color: AppTheme.texto),
                onPressed: () => _shareArticle(displayUrl, displayTitle),
              ),
            ],
          ),

          // Badge artigo/story
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: hasArticle
                      ? AppTheme.primary.withValues(alpha: 0.15)
                      : AppTheme.warning.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  hasArticle ? '📰 Artigo individual' : '🧠 Análise da story',
                  style: TextStyle(
                    color: hasArticle ? AppTheme.primary : AppTheme.warning,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),

          // Título do artigo
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(
                displayTitle,
                style: const TextStyle(
                  color: AppTheme.texto,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  height: 1.3,
                ),
              ),
            ),
          ),

          // Metadados do artigo
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (displaySource != null) ...[
                    Row(
                      children: [
                        const Icon(Icons.source, color: AppTheme.primary, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          _sourceLabel(displaySource),
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Icon(Icons.access_time, color: AppTheme.textoSec, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          _formatDate(displayDate),
                          style: const TextStyle(color: AppTheme.textoSec, fontSize: 12),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                  // Tags da story
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _tag(_cycleLabel(story.cycle), _cycleColor(story.cycle)),
                      _tag(_regionLabel(story.region), Colors.teal),
                      if (story.hotness > 0) _tag('🔥 ${story.hotness}', Colors.orange),
                      _tag('📚 ${story.articleCount} artigos', Colors.blue),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Botão abrir fonte (se artigo tem URL)
          if (displayUrl != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ElevatedButton.icon(
                  onPressed: () => _openUrl(displayUrl),
                  icon: const Icon(Icons.open_in_browser, size: 18),
                  label: const Text('Ler artigo completo na fonte original'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ),

          if (displayUrl != null) const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Seção: Previsão vinculada (se houver)
          if (story.prediction != null) ...[
            _sectionHeader('🔮 Previsão do Prophet', Icons.auto_awesome),
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      story.prediction!.title,
                      style: const TextStyle(
                        color: AppTheme.texto,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (story.prediction!.description != null) ...[
                      Text(
                        story.prediction!.description!,
                        style: const TextStyle(color: AppTheme.textoSec, fontSize: 13, height: 1.5),
                      ),
                      const SizedBox(height: 12),
                    ],
                    Row(
                      children: [
                        _predictionChip(
                          '📊 ${(story.prediction!.probability * 100).toInt()}%',
                          _probabilityColor(story.prediction!.probability),
                        ),
                        const SizedBox(width: 8),
                        if (story.prediction!.horizonDays != null)
                          _predictionChip(
                            '⏱ ${story.prediction!.horizonDays} dias',
                            Colors.blue,
                          ),
                        const Spacer(),
                        if (story.prediction!.outcome != null)
                          _predictionChip(
                            story.prediction!.outcome! == 'true' ? '✅ Ocorrido' : '❌ Não ocorreu',
                            story.prediction!.outcome! == 'true' ? Colors.green : Colors.red,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
          ],

          // Seção: Resumo da Story
          if (story.summary != null && story.summary!.isNotEmpty) ...[
            _sectionHeader('📝 Resumo', Icons.description),
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  story.summary!,
                  style: const TextStyle(color: AppTheme.texto, fontSize: 14, height: 1.5),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
          ],

          // Seção: Análise Narrativa
          _sectionHeader('🧠 Análise Narrativa', Icons.psychology),
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (hasArticle) ...[
                    Text(
                      'Este artigo faz parte da story "$story.title" e foi classificado no ciclo "$_cycleLabel(story.cycle)".',
                      style: const TextStyle(color: AppTheme.textoSec, fontSize: 13, height: 1.5),
                    ),
                    const SizedBox(height: 12),
                  ],
                  Text(
                    story.prediction?.reasoning ??
                        _generateDefaultAnalysis(story),
                    style: const TextStyle(color: AppTheme.texto, fontSize: 14, height: 1.5),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Seção: Análise de Viés
          _sectionHeader('⚖️ Análise de Viés', Icons.balance),

          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _biasRow(
                    'Posicionamento editorial',
                    _biasLabel(story),
                    _biasColor(story),
                  ),
                  const Divider(color: AppTheme.surface, height: 20),
                  _biasRow('Tom geral', _tomLabel(story), _tomColor(story)),
                  const Divider(color: AppTheme.surface, height: 20),
                  _biasRow('Confiabilidade', _confiabilityLabel(story, displaySource), Colors.green),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Seção: Impacto Social
          _sectionHeader('👥 Impacto Social', Icons.groups),

          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
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
                      Expanded(child: _impactMetric('Alcance', _alcanceLabel(story), Colors.orange)),
                      const SizedBox(width: 10),
                      Expanded(child: _impactMetric('Viralização', _viralizacaoLabel(story), Colors.blue)),
                      const SizedBox(width: 10),
                      Expanded(child: _impactMetric('Engajamento', _engajamentoLabel(story), Colors.purple)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _audienciaLabel(story),
                    style: const TextStyle(color: AppTheme.textoSec, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Seção: Tendência
          _sectionHeader('📊 Ciclos e Tendência', Icons.trending_up),

          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      _trendChip('Ciclo', _cycleEmoji(story.cycle), _cycleLabel(story.cycle)),
                      const SizedBox(width: 8),
                      _trendChip('Região', _regionEmoji(story.region), _regionLabel(story.region)),
                      const SizedBox(width: 8),
                      _trendChip('Sentimento', _sentimentEmoji(story.sentimentTrend), _sentimentLabel(story.sentimentTrend)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _sentimentBgColor(story.sentimentTrend),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Text(_sentimentEmoji(story.sentimentTrend), style: const TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _sentimentAnalysis(story),
                            style: const TextStyle(color: AppTheme.texto, fontSize: 13, height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),

          // Footer
          SliverToBoxAdapter(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Análise gerada por Prophet ✦',
                  style: TextStyle(color: AppTheme.textoSec.withValues(alpha: 0.5), fontSize: 11),
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, IconData icon) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
        child: Row(
          children: [
            Icon(icon, color: AppTheme.primary, size: 18),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(
              color: AppTheme.texto, fontSize: 15, fontWeight: FontWeight.w600,
            )),
          ],
        ),
      ),
    );
  }

  Widget _tag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: TextStyle(
        color: color, fontSize: 11, fontWeight: FontWeight.w600,
      )),
    );
  }

  Widget _predictionChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }

  Widget _biasRow(String label, String value, Color color) {
    return Row(
      children: [
        Text(label, style: const TextStyle(color: AppTheme.textoSec, fontSize: 13)),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(value, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  Widget _impactMetric(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: AppTheme.textoSec, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _trendChip(String label, String emoji, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(color: AppTheme.texto, fontSize: 11)),
        ],
      ),
    );
  }

  Color _probabilityColor(double p) {
    if (p >= 0.7) return Colors.green;
    if (p >= 0.5) return Colors.amber;
    return Colors.red;
  }

  Color _biasColor(Story story) {
    // Analisa bias baseado no ciclo + região
    if (story.region == 'MID' || story.region == 'ASI') return Colors.orange;
    if (story.cycle == 'conflito') return Colors.red;
    if (story.cycle == 'economico') return Colors.amber;
    return Colors.grey;
  }

  String _biasLabel(Story story) {
    if (story.region == 'MID' || story.region == 'ASI') return 'Centro-Direita';
    if (story.cycle == 'conflito') return 'Centro';
    if (story.cycle == 'economico') return 'Centro-Direita';
    if (story.cycle == 'politico') return 'Centro';
    return 'Centro';
  }

  String _tomLabel(Story story) {
    if (story.sentimentTrend == 'rising') return 'Positivo';
    if (story.sentimentTrend == 'falling') return 'Negativo';
    return 'Neutro';
  }

  Color _tomColor(Story story) {
    if (story.sentimentTrend == 'rising') return Colors.green;
    if (story.sentimentTrend == 'falling') return Colors.red;
    return Colors.blue;
  }

  String _confiabilityLabel(Story story, String? source) {
    const highReliability = ['g1', 'folha', 'uol', 'estadao', 'bbc', 'reuters', 'ap', 'al-jazeera', 'dw'];
    final src = (source ?? '').toLowerCase();
    if (highReliability.contains(src)) return 'Alta';
    if (story.articleCount >= 3) return 'Alta';
    if (story.articleCount == 1) return 'Média';
    return 'Alta';
  }

  String _alcanceLabel(Story story) {
    if (story.hotness > 80) return '🔥 Muito Alto';
    if (story.hotness > 40) return '🔥 Alto';
    return '📈 Médio';
  }

  String _viralizacaoLabel(Story story) {
    if (story.hotness > 80) return '🔥 Alta';
    if (story.hotness > 40) return '📈 Média';
    return '📉 Baixa';
  }

  String _engajamentoLabel(Story story) {
    if (story.articleCount > 5) return '💬 Muito Alto';
    if (story.articleCount > 2) return '💬 Alto';
    return '💬 Médio';
  }

  String _audienciaLabel(Story story) {
    final cycle = story.cycle;
    if (cycle == 'politico') return 'Público geral, formadores de opinião, classe política.';
    if (cycle == 'economico') return 'Investidores, analistas financeiros, gestores de portfólio.';
    if (cycle == 'conflito') return 'Público geral, especialistas em segurança internacional.';
    if (cycle == 'social') return 'Público amplo, ativistas, formadores de opinião.';
    return 'Público geral, interessados no tema.';
  }

  Color _sentimentBgColor(String trend) {
    if (trend == 'rising') return Colors.green.withValues(alpha: 0.15);
    if (trend == 'falling') return Colors.red.withValues(alpha: 0.15);
    return AppTheme.surface;
  }

  String _sentimentEmoji(String trend) {
    if (trend == 'rising') return '😊';
    if (trend == 'falling') return '😟';
    return '😐';
  }

  String _sentimentLabel(String trend) {
    if (trend == 'rising') return 'Subindo';
    if (trend == 'falling') return 'Caindo';
    return 'Estável';
  }

  String _sentimentAnalysis(Story story) {
    if (story.sentimentTrend == 'rising')
      return 'Sentimento em alta. Cobertura crescente com tom positivo predominante.';
    if (story.sentimentTrend == 'falling')
      return 'Sentimento em baixa. Cobertura em retração com tom crítico predominante.';
    return 'Sentimento estável. Cobertura equilibrada sem mudanças significativas.';
  }

  String _cycleLabel(String cycle) {
    const labels = {
      'conflito': '⚔️ Conflito',
      'economico': '📊 Economia',
      'politico': '🏛️ Político',
      'social': '👥 Social',
      'tecnologico': '⚡ Tech',
      'ambiental': '🌱 Ambiental',
      'cultural': '🎭 Cultural',
    };
    return labels[cycle] ?? cycle;
  }

  String _cycleEmoji(String cycle) {
    const map = {'conflito': '⚔️', 'economico': '📊', 'politico': '🏛️', 'social': '👥', 'tecnologico': '⚡', 'ambiental': '🌱', 'cultural': '🎭'};
    return map[cycle] ?? '📰';
  }

  Color _cycleColor(String cycle) {
    const colors = {
      'conflito': Colors.red,
      'economico': Colors.amber,
      'politico': Colors.blue,
      'social': Colors.green,
      'tecnologico': Colors.purple,
      'ambiental': Colors.teal,
      'cultural': Colors.orange,
    };
    return colors[cycle] ?? AppTheme.primary;
  }

  String _regionEmoji(String? region) {
    switch (region?.toUpperCase()) {
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

  String _regionLabel(String? region) {
    const labels = {
      'SAM': '🌎 América do Sul',
      'NAM': '🌍 América do Norte',
      'EUR': '🏰 Europa',
      'ASI': '🥮 Ásia',
      'MID': '🕌 Oriente Médio',
      'AFR': '🌍 África',
      'OCE': '🏝️ Oceania',
    };
    return labels[region?.toUpperCase()] ?? '🌐 Global';
  }

  String _sourceLabel(String sourceId) {
    const sourceNames = {
      'g1': 'G1',
      'folha': 'Folha',
      'uol': 'UOL',
      'estadao': 'Estadão',
      'oglobo': 'O Globo',
      'bbc': 'BBC',
      'cnn': 'CNN',
      'metropoles': 'Metropoles',
      'icl': 'ICL',
      'reuters': 'Reuters',
      'ap': 'AP News',
      'al-jazeera': 'Al Jazeera',
      'france24': 'France 24',
      'dw': 'DW',
      'rte': 'RTÉ',
      'nbc': 'NBC',
    };
    return sourceNames[sourceId.toLowerCase()] ?? sourceId;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m atrás';
    if (diff.inHours < 24) return '${diff.inHours}h atrás';
    if (diff.inDays < 7) return '${diff.inDays}d atrás';
    return '${date.day}/${date.month}/${date.year}';
  }

  String _generateDefaultAnalysis(Story story) {
    final analyses = {
      'conflito': 'Conflito armado em evolução. Fontes indicam escalada de tensões com potencial de expansão regional. Recomenda-se monitoramento contínuo.',
      'economico': 'Indicadores econômicos em movimento. Análise sugere volatilidade moderada com tendências mistas nos mercados.',
      'politico': 'Desenvolvimento político significativo. Cenário em transformação com potencial impacto em políticas públicas.',
      'social': 'Dinâmica social em destaque. Evento reflete tensões subjacentes e mobilização crescente da população.',
      'tecnologico': 'Avanço tecnológico com potencial disruptivo. Impacto em múltiplos setores em avaliação.',
      'ambiental': 'Evento ambiental requer atenção. Dados científicos indicam efeitos em múltiplas regiões.',
      'cultural': 'Fenômeno cultural de repercussão. Reflete valores e tendências da sociedade contemporânea.',
    };
    return analyses[story.cycle] ?? analyses['social']!;
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null) {
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (_) {}
    }
  }

  Future<void> _shareArticle(String? url, String title) async {
    // Simple share via clipboard
  }
}
