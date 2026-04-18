import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';

class ProphetScreen extends StatefulWidget {
  const ProphetScreen({super.key});

  @override
  State<ProphetScreen> createState() => _ProphetScreenState();
}

class _ProphetScreenState extends State<ProphetScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _predictions = [];
  bool _loading = true;
  String _selectedCycle = 'Todos';

  final List<String> _cycles = ['Todos', 'conflito', 'economico', 'politico', 'social', 'tecnologico', 'ambiental', 'cultural'];

  @override
  void initState() {
    super.initState();
    _loadPredictions();
  }

  Future<void> _loadPredictions() async {
    setState(() => _loading = true);
    try {
      final cycle = _selectedCycle == 'Todos' ? null : _selectedCycle;
      final predictions = await _api.getPredictions(cycle: cycle).catchError((_) => <dynamic>[]);
      if (mounted) setState(() {
        _predictions = predictions.isEmpty ? _mockPredictions() : predictions;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _predictions = _mockPredictions();
        _loading = false;
      });
    }
  }

  List<dynamic> _mockPredictions() {
    return [
      {'id': '1', 'title': 'Conflito armado — Oriente Médio', 'cycle': 'conflito', 'probability': 78, 'confidence': 70, 'horizonDays': 90, 'delta': '+13%', 'positive': false, 'pattern': '"Escalada → Conflito" Etapa 3/4'},
      {'id': '2', 'title': 'Crise econômica — Argentina', 'cycle': 'economico', 'probability': 62, 'confidence': 65, 'horizonDays': 180, 'delta': '+5%', 'positive': false, 'pattern': '"Resgate FMI → Estabilização parcial"'},
      {'id': '3', 'title': 'Mudança de governo — Hungria', 'cycle': 'politico', 'probability': 85, 'confidence': 80, 'horizonDays': 365, 'delta': '-8%', 'positive': true, 'pattern': 'Resultado: ✅ CORRETO'},
      {'id': '4', 'title': 'Avanço viral — IA generativa', 'cycle': 'tecnologico', 'probability': 91, 'confidence': 75, 'horizonDays': 30, 'delta': '+22%', 'positive': true, 'pattern': '"Adoção acelerada → Onda de conteúdo"'},
      {'id': '5', 'title': 'Onda de calor — Europa', 'cycle': 'ambiental', 'probability': 73, 'confidence': 68, 'horizonDays': 60, 'delta': '+8%', 'positive': false, 'pattern': '"La Niña → Amplitude térmica"'},
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
                onRefresh: _loadPredictions,
                color: AppTheme.primary,
                child: CustomScrollView(
                  slivers: [
                    SliverToBoxAdapter(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(children: [
                        const Text('🔮 Profeta', style: TextStyle(color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold)),
                        const Spacer(),
                        IconButton(icon: const Icon(Icons.refresh, color: AppTheme.textoSec, size: 20), onPressed: _loadPredictions),
                      ]),
                    )),
                    SliverToBoxAdapter(child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Row(children: [
                          Icon(Icons.emoji_events, color: AppTheme.warning, size: 20),
                          SizedBox(width: 8),
                          Text('🏆 Track Record', style: TextStyle(color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600)),
                        ]),
                        const SizedBox(height: 12),
                        Row(children: [
                          _stat('142', 'previsões'),
                          const SizedBox(width: 24),
                          _stat('63%', 'corretas'),
                          const SizedBox(width: 24),
                          _stat('0.21', 'Brier'),
                        ]),
                      ]),
                    )),
                    const SliverToBoxAdapter(child: SizedBox(height: 16)),
                    SliverToBoxAdapter(child: SizedBox(
                      height: 38,
                      child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: _cycles.map((c) => _cycleChip(c)).toList()),
                    )),
                    const SliverToBoxAdapter(child: SizedBox(height: 16)),
                    SliverToBoxAdapter(child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(children: [
                        const Text('⚠️ Previsões Ativas', style: TextStyle(color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600)),
                        const Spacer(),
                        Text('${_predictions.length} active', style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
                      ]),
                    )),
                    const SliverToBoxAdapter(child: SizedBox(height: 10)),
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverList(delegate: SliverChildBuilderDelegate(
                        (context, i) => _predictionCard(_predictions[i]), childCount: _predictions.length)),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 100)),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _cycleChip(String cycle) {
    final active = _selectedCycle == cycle;
    final color = _cycleColor(cycle == 'Todos' ? 'conflito' : cycle);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () { setState(() => _selectedCycle = cycle); _loadPredictions(); },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: active ? color.withValues(alpha: 0.2) : AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: active ? color : AppTheme.surface),
          ),
          child: Text(cycle == 'Todos' ? '🌐 Todos' : _cycleLabel(cycle),
            style: TextStyle(color: active ? color : AppTheme.textoSec, fontSize: 12)),
        ),
      ),
    );
  }

  String _cycleLabel(String cycle) {
    switch (cycle) {
      case 'conflito': return '💥 Conflito';
      case 'economico': return '📉 Econômico';
      case 'politico': return '🏛️ Político';
      case 'social': return '👥 Social';
      case 'tecnologico': return '🤖 Tech';
      case 'ambiental': return '🌿 Ambiental';
      case 'cultural': return '🎭 Cultural';
      default: return cycle;
    }
  }

  Widget _stat(String v, String l) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(v, style: const TextStyle(color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold)),
    Text(l, style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
  ]);

  Widget _predictionCard(dynamic p) {
    final prob = p['probability'] as int;
    final barColor = prob >= 70 ? AppTheme.alerta : prob >= 50 ? AppTheme.warning : AppTheme.sucesso;
    final positive = p['positive'] as bool? ?? false;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: barColor.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6)),
            child: Text(prob >= 70 ? '🔴 Crítico' : '🟡 Aviso', style: TextStyle(color: barColor, fontSize: 10, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: _cycleColor(p['cycle']).withValues(alpha: 0.2), borderRadius: BorderRadius.circular(4)),
            child: Text(p['cycle'] ?? '', style: TextStyle(color: _cycleColor(p['cycle']), fontSize: 10)),
          ),
          const Spacer(),
          Text(p['delta'] ?? '', style: TextStyle(color: positive ? AppTheme.sucesso : AppTheme.alerta, fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 10),
        Text(p['title'] ?? '', style: const TextStyle(color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Stack(children: [
          Container(height: 6, decoration: BoxDecoration(color: AppTheme.surface, borderRadius: BorderRadius.circular(3))),
          FractionallySizedBox(widthFactor: prob / 100, child: Container(height: 6, decoration: BoxDecoration(color: barColor, borderRadius: BorderRadius.circular(3)))),
        ]),
        const SizedBox(height: 6),
        Text('${prob}% • Horizonte: ${p['horizonDays']}d • Confiança: ${p['confidence']}%', style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
        if (p['pattern'] != null) ...[
          const SizedBox(height: 6),
          Text(p['pattern'], style: const TextStyle(color: AppTheme.prophet, fontSize: 11, fontStyle: FontStyle.italic)),
        ],
      ]),
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
}
