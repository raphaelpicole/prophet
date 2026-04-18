import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/source.dart';
import '../../data/services/api_service.dart';

class AnalysisScreen extends StatefulWidget {
  const AnalysisScreen({super.key});

  @override
  State<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends State<AnalysisScreen> {
  final ApiService _api = ApiService();
  List<Source>? _sources;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _loading = true; _error = null; });
    try {
      final sources = await _api.getSources().catchError((_) => <Source>[]);
      setState(() {
        _sources = sources.isEmpty ? _mockSources() : sources;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _sources = _mockSources();
        _loading = false;
      });
    }
  }

  List<Source> _mockSources() {
    return [
      Source(id: '1', slug: 'g1', name: 'G1', ideology: 'centro-esquerda',
          totalArticles: 142, articles24h: 23, analyzedCount: 120, failedCount: 2),
      Source(id: '2', slug: 'folha', name: 'Folha', ideology: 'centro-esquerda',
          totalArticles: 98, articles24h: 18, analyzedCount: 85, failedCount: 5),
      Source(id: '3', slug: 'uol', name: 'UOL', ideology: 'centro-esquerda',
          totalArticles: 115, articles24h: 20, analyzedCount: 100, failedCount: 3),
      Source(id: '4', slug: 'estadao', name: 'Estadão', ideology: 'centro-direita',
          totalArticles: 87, articles24h: 15, analyzedCount: 75, failedCount: 4),
      Source(id: '5', slug: 'oglobo', name: 'O Globo', ideology: 'centro-direita',
          totalArticles: 76, articles24h: 12, analyzedCount: 65, failedCount: 6),
      Source(id: '6', slug: 'cnn', name: 'CNN Brasil', ideology: 'centro',
          totalArticles: 64, articles24h: 11, analyzedCount: 55, failedCount: 2),
      Source(id: '7', slug: 'bbc', name: 'BBC Brasil', ideology: 'centro',
          totalArticles: 45, articles24h: 8, analyzedCount: 40, failedCount: 1),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : RefreshIndicator(
                onRefresh: _loadData,
                color: AppTheme.primary,
                child: CustomScrollView(
                  slivers: [
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            const Icon(Icons.analytics, color: AppTheme.primary, size: 24),
                            const SizedBox(width: 8),
                            const Text('📊 Análise Narrativa', style: TextStyle(
                              color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
                            )),
                            const Spacer(),
                            IconButton(
                              icon: const Icon(Icons.refresh, color: AppTheme.textoSec, size: 20),
                              onPressed: _loadData,
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Viés das fontes
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
                              const Text('📰 Viés por Fonte', style: TextStyle(
                                color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
                              )),
                              const SizedBox(height: 16),
                              ...?(_sources?.map((s) => _biasBar(s))) ?? [],
                            ],
                          ),
                        ),
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 20)),

                    // Grid de fontes
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            const Text('🗞️ Fontes Ativas', style: TextStyle(
                              color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
                            )),
                            const Spacer(),
                            Text(
                              '${_sources?.length ?? 0} fontes',
                              style: const TextStyle(color: AppTheme.textoSec, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 10)),

                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 1.5,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, i) => _sourceCard(_sources![i]),
                          childCount: _sources!.length,
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

  Widget _biasBar(Source s) {
    final biasPos = _biasPosition(s.ideology);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SizedBox(
                width: 100,
                child: Text(s.name, style: const TextStyle(
                  color: AppTheme.texto, fontSize: 12,
                )),
              ),
              Expanded(
                child: Stack(
                  children: [
                    Container(height: 8, decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [
                        Color(0xFF4CAF50), Color(0xFF8BC34A),
                        Color(0xFF9E9E9E), Color(0xFFFF9800), Color(0xFFF44336),
                      ]),
                      borderRadius: BorderRadius.circular(4),
                    )),
                    Positioned(
                      left: biasPos * 80,
                      child: Container(
                        width: 8, height: 8,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.black, width: 1.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  double _biasPosition(String ideology) {
    switch (ideology) {
      case 'esquerda': return 0.0;
      case 'centro-esquerda': return 0.25;
      case 'centro': return 0.5;
      case 'centro-direita': return 0.75;
      case 'direita': return 1.0;
      default: return 0.5;
    }
  }

  Widget _sourceCard(Source s) {
    // Calcula badges baseado em métricas
    final badges = <Widget>[];
    
    // Badge de alta atividade
    if (s.articles24h >= 20) {
      badges.add(_badge('🔥 Hot', const Color(0xFFFF5722)));
    } else if (s.articles24h >= 15) {
      badges.add(_badge('📈 Ativo', const Color(0xFFFF9800)));
    }
    
    // Badge de análise
    final analysisRate = s.totalArticles > 0 
        ? (s.analyzedCount / s.totalArticles * 100).round() 
        : 0;
    if (analysisRate >= 80) {
      badges.add(_badge('✅ Analisado', const Color(0xFF4CAF50)));
    } else if (analysisRate >= 50) {
      badges.add(_badge('🔄 Parcial', const Color(0xFF2196F3)));
    }
    
    // Badge de fiabilidade (poucos erros)
    if (s.failedCount == 0) {
      badges.add(_badge('💚 0 erros', const Color(0xFF4CAF50)));
    } else if (s.failedCount <= 3) {
      badges.add(_badge('⚠️ ${s.failedCount} erros', const Color(0xFFFF9800)));
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badges na parte superior
          if (badges.isNotEmpty)
            Wrap(
              spacing: 4,
              runSpacing: 4,
              children: badges,
            ),
          if (badges.isNotEmpty) const SizedBox(height: 8),
          
          // Nome e ideologia
          Text(s.name, style: const TextStyle(
            color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
          )),
          Text(_ideologyLabel(s.ideology), style: TextStyle(
            color: _biasColor(s.ideology), fontSize: 10,
          )),
          
          const Spacer(),
          
          // Métricas
          Row(
            children: [
              Text('${s.articles24h}', style: const TextStyle(
                color: AppTheme.texto, fontSize: 18, fontWeight: FontWeight.bold,
              )),
              const SizedBox(width: 4),
              const Text('art/24h', style: TextStyle(color: AppTheme.textoSec, fontSize: 10)),
              const Spacer(),
              Text('${s.analyzedCount}/${s.totalArticles}', style: const TextStyle(
                color: AppTheme.textoSec, fontSize: 10,
              )),
            ],
          ),
          
          // Barra de progresso de análise
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: s.totalArticles > 0 ? s.analyzedCount / s.totalArticles : 0,
              backgroundColor: AppTheme.surface,
              valueColor: AlwaysStoppedAnimation<Color>(_analysisColor(analysisRate)),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.5), width: 1),
      ),
      child: Text(text, style: TextStyle(
        color: color, fontSize: 9, fontWeight: FontWeight.w600,
      )),
    );
  }

  Color _analysisColor(int rate) {
    if (rate >= 80) return const Color(0xFF4CAF50);
    if (rate >= 50) return const Color(0xFF2196F3);
    return const Color(0xFFFF9800);
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

  String _ideologyLabel(String ideology) {
    switch (ideology) {
      case 'esquerda': return '⬅️ Esquerda';
      case 'centro-esquerda': return '↙️ Centro-Esquerda';
      case 'centro': return '⏺️ Centro';
      case 'centro-direita': return '↗️ Centro-Direita';
      case 'direita': return '➡️ Direita';
      default: return '❓ Indefinido';
    }
  }
}
