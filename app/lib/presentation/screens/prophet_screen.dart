import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class Prediction {
  final String id, title, cycle;
  final int probability, confidence, horizonDays;
  final String delta;
  final bool positive;
  final String pattern;

  Prediction({
    required this.id,
    required this.title,
    required this.cycle,
    required this.probability,
    required this.confidence,
    required this.horizonDays,
    required this.delta,
    required this.positive,
    required this.pattern,
  });
}

class ProphetScreen extends StatelessWidget {
  const ProphetScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final predictions = [
      Prediction(
        id: '1',
        title: 'Conflito armado — Oriente Médio',
        cycle: 'conflito',
        probability: 78,
        confidence: 70,
        horizonDays: 90,
        delta: '+13%',
        positive: false,
        pattern: '"Escalada → Conflito" Etapa 3/4',
      ),
      Prediction(
        id: '2',
        title: 'Crise econômica — Argentina',
        cycle: 'economico',
        probability: 62,
        confidence: 65,
        horizonDays: 180,
        delta: '+5%',
        positive: false,
        pattern: '"Resgate FMI → Estabilização parcial"',
      ),
      Prediction(
        id: '3',
        title: 'Mudança de governo — Hungria',
        cycle: 'politico',
        probability: 85,
        confidence: 80,
        horizonDays: 365,
        delta: '-8%',
        positive: true,
        pattern: 'Resultado: ✅ CORRETO',
      ),
    ];

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: const Text('🔮 Profeta', style: TextStyle(
                  color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
                )),
              ),
            ),
            // Track Record
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
                    const Row(
                      children: [
                        Icon(Icons.emoji_events, color: AppTheme.warning, size: 20),
                        SizedBox(width: 8),
                        Text('🏆 Track Record', style: TextStyle(
                          color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
                        )),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _stat('142', 'previsões'),
                        const SizedBox(width: 24),
                        _stat('63%', 'corretas'),
                        const SizedBox(width: 24),
                        _stat('0.21', 'Brier'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Text('⚠️ Previsões Ativas', style: TextStyle(
                      color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
                    )),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('Conflito', style: TextStyle(
                        color: AppTheme.primary, fontSize: 11,
                      )),
                    ),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 10)),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _predictionCard(predictions[index]),
                  childCount: predictions.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _stat(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: const TextStyle(
          color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
        )),
        Text(label, style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
      ],
    );
  }

  Widget _predictionCard(Prediction p) {
    final barColor = p.probability >= 70
        ? AppTheme.alerta
        : p.probability >= 50
            ? AppTheme.warning
            : AppTheme.sucesso;

    return Container(
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
                  color: barColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  p.probability >= 70 ? '🔴 Crítico' : '🟡 Aviso',
                  style: TextStyle(color: barColor, fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ),
              const Spacer(),
              Text(p.delta,
                  style: TextStyle(
                    color: p.positive ? AppTheme.sucesso : AppTheme.alerta,
                    fontSize: 12, fontWeight: FontWeight.w600,
                  )),
            ],
          ),
          const SizedBox(height: 10),
          Text(p.title, style: const TextStyle(
            color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
          )),
          const SizedBox(height: 8),
          // Barra de probabilidade
          Stack(
            children: [
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              FractionallySizedBox(
                widthFactor: p.probability / 100,
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    color: barColor,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text('${p.probability}% • Horizonte: ${p.horizonDays}d • Confiança: ${p.confidence}%',
              style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
          const SizedBox(height: 6),
          Text(p.pattern, style: const TextStyle(
            color: AppTheme.prophet, fontSize: 11, fontStyle: FontStyle.italic,
          )),
        ],
      ),
    );
  }
}
