import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/story.dart';

class ArticleDetailScreen extends StatelessWidget {
  final Story story;

  const ArticleDetailScreen({super.key, required this.story});

  @override
  Widget build(BuildContext context) {
    // Análise simulada (vinda da API ou gerada)
    final analysis = _generateAnalysis(story);

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
                story.mainSubject,
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
              IconButton(
                icon: const Icon(Icons.share, size: 20, color: AppTheme.texto),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.bookmark_border, size: 20, color: AppTheme.texto),
                onPressed: () {},
              ),
            ],
          ),

          // Título
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                story.title,
                style: const TextStyle(
                  color: AppTheme.texto,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  height: 1.3,
                ),
              ),
            ),
          ),

          // Metadados
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _tag(_cycleLabel(story.cycle), _cycleColor(story.cycle)),
                  const SizedBox(width: 8),
                  _tag('🔥 ${story.hotness}', Colors.orange),
                  const Spacer(),
                  const Icon(Icons.access_time, color: AppTheme.textoSec, size: 14),
                  const SizedBox(width: 4),
                  const Text('4 min leitura', style: TextStyle(
                    color: AppTheme.textoSec, fontSize: 12,
                  )),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

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
                  const Text('Resumo:', style: TextStyle(
                    color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600,
                  )),
                  const SizedBox(height: 8),
                  Text(
                    analysis['resumo'] ?? '',
                    style: const TextStyle(color: AppTheme.texto, fontSize: 14, height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  const Text('Conclusão:', style: TextStyle(
                    color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600,
                  )),
                  const SizedBox(height: 8),
                  Text(
                    analysis['conclusao'] ?? '',
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
                    analysis['vies'] ?? 'Centro',
                    _biasColor(analysis['vies'] ?? 'Centro'),
                  ),
                  const Divider(color: AppTheme.surface, height: 20),
                  _biasRow('Tom geral', analysis['tom'] ?? 'Neutro', _tomColor(analysis['tom'] ?? 'Neutro')),
                  const Divider(color: AppTheme.surface, height: 20),
                  _biasRow('Confiabilidade', analysis['confiabilidade'] ?? 'Alta', Colors.green),
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
                      Expanded(child: _impactMetric('Alcance', analysis['alcance'] ?? '🔥 Alto', Colors.orange)),
                      const SizedBox(width: 10),
                      Expanded(child: _impactMetric('Viralização', analysis['viralizacao'] ?? '📈 Média', Colors.blue)),
                      const SizedBox(width: 10),
                      Expanded(child: _impactMetric('Engajamento', analysis['engajamento'] ?? '💬 Alto', Colors.purple)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text('Audiência provável:', style: TextStyle(
                    color: AppTheme.textoSec, fontSize: 11,
                  )),
                  const SizedBox(height: 6),
                  Text(
                    analysis['audiencia'] ?? '',
                    style: const TextStyle(color: AppTheme.texto, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Seção: Tendência
          _sectionHeader('📊 Tendência', Icons.trending_up),

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
                      _trendChip('Sentimento', _sentimentEmoji(analysis['sentimento']), analysis['sentimento'] ?? 'Neutro'),
                      const SizedBox(width: 8),
                      _trendChip('Ciclo', _cycleEmoji(story.cycle), _cycleLabel(story.cycle)),
                      const SizedBox(width: 8),
                      _trendChip('Horizonte', '⏱', '${analysis['horizonte'] ?? '30'} dias'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _sentimentBgColor(analysis['sentimento']),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Text(_sentimentEmoji(analysis['sentimento']), style: const TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            analysis['sentimentoNota'] ?? '',
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

          const SliverToBoxAdapter(child: SizedBox(height: 20)),

          // Seção: Tags e cycle
          _sectionHeader('🏷️ Classificação', Icons.label),

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
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _tag(_cycleLabel(story.cycle), _cycleColor(story.cycle)),
                      _tag('📰 Notícia', Colors.blue),
                      _tag('🌎 ${story.mainSubject}', Colors.green),
                      _tag('🔥 Hot', Colors.orange),
                    ],
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

  Color _biasColor(String vies) {
    switch (vies) {
      case 'Esquerda': return Colors.green;
      case 'Centro-Esquerda': return Colors.lightGreen;
      case 'Centro': return Colors.grey;
      case 'Centro-Direita': return Colors.orange;
      case 'Direita': return Colors.red;
      default: return Colors.grey;
    }
  }

  Color _tomColor(String tom) {
    switch (tom) {
      case 'Positivo': return Colors.green;
      case 'Neutro': return Colors.blue;
      case 'Negativo': return Colors.red;
      default: return Colors.grey;
    }
  }

  Color _sentimentBgColor(String? s) {
    switch (s) {
      case 'Positivo': return Colors.green.withValues(alpha: 0.15);
      case 'Negativo': return Colors.red.withValues(alpha: 0.15);
      default: return AppTheme.surface;
    }
  }

  String _sentimentEmoji(String? s) {
    switch (s) {
      case 'Positivo': return '😊';
      case 'Negativo': return '😟';
      default: return '😐';
    }
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

  Map<String, String> _generateAnalysis(Story story) {
    // Simula análise baseada no ciclo/título
    final cycle = story.cycle;
    
    final analyses = {
      'conflito': {
        'resumo': 'Conflito armado reportado com escalada de tensões. Fontes indicam mobilização de forças e relatos de confrontos em múltiplas regiões.',
        'conclusao': 'Situação em evolução. Recomenda-se monitoramento contínuo nas próximas 48-72 horas para avaliar possibilidade de/mediação.',
        'vies': 'Centro',
        'tom': 'Informativo',
        'confiabilidade': 'Alta',
        'alcance': '🔥 Alto',
        'viralizacao': '📈 Média',
        'engajamento': '💬 Alto',
        'audiencia': 'Público geral, especialistas em segurança internacional, gestores de risco.',
        'sentimento': 'Negativo',
        'sentimentoNota': 'Tom predominantemente sério. Cobertura factual com destaque para impacto humanitário.',
        'horizonte': '90',
      },
      'economico': {
        'resumo': 'Indicadores econômicos mostram movimento de recuperação/estabilização. Análise de mercado aponta tendências mistas.',
        'conclusao': 'Mercado reagiu com volatilidade moderada. Recomenda-se cautela e acompanhamento de indicadores-chave.',
        'vies': 'Centro-Direita',
        'tom': 'Neutro',
        'confiabilidade': 'Alta',
        'alcance': '📈 Alto',
        'viralizacao': '📈 Média',
        'engajamento': '💬 Médio',
        'audiencia': 'Investidores, analistas financeiros, gestores de portfólio.',
        'sentimento': 'Neutro',
        'sentimentoNota': 'Linguagem técnica e precisa. Dados apresentados com contexto histórico.',
        'horizonte': '180',
      },
      'politico': {
        'resumo': 'Desenvolvimento político significativo com potencial mudança de cenário. Análise de implicações em andamento.',
        'conclusao': 'Cenário político em transformação. Acompanhamento recomendado para avaliar impacto em políticas públicas.',
        'vies': 'Centro',
        'tom': 'Neutro',
        'confiabilidade': 'Alta',
        'alcance': '🔥 Alto',
        'viralizacao': '📈 Alta',
        'engajamento': '💬 Muito Alto',
        'audiencia': 'Público geral, formadores de opinião, classe política.',
        'sentimento': 'Neutro',
        'sentimentoNota': 'Análise equilibrada com presentation de múltiplas perspectivas políticas.',
        'horizonte': '365',
      },
      'social': {
        'resumo': 'Movimento social em destaque com участиe crescente da população. Dinâmica coletiva em evidência.',
        'conclusao': 'Evento social reflete tensões subjacentes. Monitorar evolução e potencial desdobramentos.',
        'vies': 'Centro-Esquerda',
        'tom': 'Informativo',
        'confiabilidade': 'Média',
        'alcance': '🔥 Muito Alto',
        'viralizacao': '🔥 Alta',
        'engajamento': '💬 Muito Alto',
        'audiencia': 'Público amplo, ativistas, formadores de opinião.',
        'sentimento': 'Positivo',
        'sentimentoNota': 'Destaque para aspecto comunitário e participação cidadã.',
        'horizonte': '60',
      },
      'tecnologico': {
        'resumo': 'Avanço tecnológico em destaque com potencial disruptivo. Análise de impacto em diferentes setores.',
        'conclusao': 'Tecnologia em ritmo acelerado de adoção. Recomenda-se atenção às implicações de longo prazo.',
        'vies': 'Centro',
        'tom': 'Positivo',
        'confiabilidade': 'Alta',
        'alcance': '📈 Alto',
        'viralizacao': '🔥 Alta',
        'engajamento': '💬 Alto',
        'audiencia': 'Profissionais de tecnologia, investidores, usuários précoces.',
        'sentimento': 'Positivo',
        'sentimentoNota': 'Tom otimista mas com menção de desafios éticos e de implementação.',
        'horizonte': '30',
      },
      'ambiental': {
        'resumo': 'Evento ambiental crítico em curso com efeitos em múltiplas regiões. Dados científicos em destaque.',
        'conclusao': 'Situação exige atenção imediata. Recomenda-se acompanhamento de diretrizes oficiais.',
        'vies': 'Centro',
        'tom': 'Neutro',
        'confiabilidade': 'Alta',
        'alcance': '🔥 Alto',
        'viralizacao': '📈 Média',
        'engajamento': '💬 Alto',
        'audiencia': 'Público geral, organizações ambientais, gestores públicos.',
        'sentimento': 'Negativo',
        'sentimentoNota': 'Dados científicos apresentados com urgência sem alarme exagerado.',
        'horizonte': '60',
      },
      'cultural': {
        'resumo': 'Evento cultural de grande repercussão. Análise de tendências e impacto no imaginário coletivo.',
        'conclusao': 'Fenômeno cultural reflete valores e tensões da sociedade contemporânea.',
        'vies': 'Centro',
        'tom': 'Positivo',
        'confiabilidade': 'Alta',
        'alcance': '📈 Médio',
        'viralizacao': '📈 Alta',
        'engajamento': '💬 Alto',
        'audiencia': 'Público культурно engajado, formadores de tendência.',
        'sentimento': 'Positivo',
        'sentimentoNota': 'Linguagem animada com destaque para aspecto criativo e inovação.',
        'horizonte': '120',
      },
    };

    return analyses[cycle] ?? analyses['social']!;
  }
}