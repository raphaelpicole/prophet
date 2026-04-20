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
  String _selectedCycle = 'Todos';
  final List<String> _cycles = ['Todos', 'conflito', 'economico', 'politico', 'social', 'tecnologico', 'ambiental', 'cultural'];

  Future<List<dynamic>> _loadPredictions() async {
    final cycle = _selectedCycle == 'Todos' ? null : _selectedCycle;
    return await _api.getPredictions(cycle: cycle).catchError((_) => []);
  }

  void _setCycle(String cycle) {
    setState(() => _selectedCycle = cycle);
  }



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildTrackRecord(),
            _buildCycleFilter(),
            Expanded(child: _buildPredictionsList()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
      child: Row(
        children: [
          const Text('🔮 Profeta', style: TextStyle(
            color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
          )),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.textoSec, size: 20),
            onPressed: () => setState(() {}),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackRecord() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [
            Icon(Icons.emoji_events, color: AppTheme.warning, size: 20),
            SizedBox(width: 8),
            Text('🏆 Track Record', style: TextStyle(
              color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
            )),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            _stat('142', 'previsões'),
            const SizedBox(width: 24),
            _stat('63%', 'corretas'),
            const SizedBox(width: 24),
            _stat('0.21', 'Brier'),
          ]),
        ],
      ),
    );
  }

  Widget _buildCycleFilter() {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        children: _cycles.map((c) => _cycleChip(c)).toList(),
      ),
    );
  }

  Widget _buildPredictionsList() {
    return FutureBuilder<List<dynamic>>(
      future: _loadPredictions(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2),
          );
        }

        final predictions = snapshot.data ?? [];

        if (predictions.isEmpty) {
          return Center(child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.psychology_outlined, color: AppTheme.textoSec, size: 48),
              const SizedBox(height: 12),
              const Text('Nenhuma previsão disponível', style: TextStyle(
                color: AppTheme.textoSec, fontSize: 14,
              )),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => setState(() {}),
                child: const Text('Tentar novamente'),
              ),
            ],
          ));
        }

        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
          itemCount: predictions.length + 1,
          itemBuilder: (context, i) {
            if (i == 0) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(children: [
                  const Text('⚠️ Previsões Ativas', style: TextStyle(
                    color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
                  )),
                  const Spacer(),
                  Text('${predictions.length} active', style: const TextStyle(
                    color: AppTheme.textoSec, fontSize: 11,
                  )),
                ]),
              );
            }
            return _predictionCard(predictions[i - 1]);
          },
        );
      },
    );
  }

  Widget _cycleChip(String cycle) {
    final active = _selectedCycle == cycle;
    final color = _cycleColor(cycle == 'Todos' ? 'conflito' : cycle);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () { _setCycle(cycle); },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: active ? color.withValues(alpha: 0.2) : AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: active ? color : AppTheme.surface),
          ),
          child: Text(
            cycle == 'Todos' ? '🌐 Todos' : _cycleLabel(cycle),
            style: TextStyle(
              color: active ? color : AppTheme.textoSec,
              fontSize: 12,
              fontWeight: active ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  String _cycleLabel(String cycle) {
    const labels = {
      'conflito': '💥 Conflito',
      'economico': '📉 Econômico',
      'politico': '🏛️ Político',
      'social': '👥 Social',
      'tecnologico': '🤖 Tech',
      'ambiental': '🌿 Ambiental',
      'cultural': '🎭 Cultural',
    };
    return labels[cycle] ?? cycle;
  }

  Widget _stat(String v, String l) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(v, style: const TextStyle(
        color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
      )),
      Text(l, style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
    ],
  );

  Widget _predictionCard(dynamic p) {
    final prob = (p['probability'] is num
        ? (p['probability'] as num).toDouble()
        : (double.tryParse(p['probability'].toString()) ?? 0.5) * 100).toInt();
    final barColor = prob >= 70
        ? AppTheme.alerta
        : prob >= 50
            ? AppTheme.warning
            : AppTheme.sucesso;
    final positive = p['positive'] as bool? ?? false;

    return GestureDetector(
      onTap: () => _showPredictionDetail(p, prob, barColor, positive),
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
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: barColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  prob >= 70 ? '🔴 Crítico' : '🟡 Aviso',
                  style: TextStyle(color: barColor, fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: _cycleColor(p['cycle'] ?? '').withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  _cycleLabel(p['cycle'] ?? ''),
                  style: TextStyle(color: _cycleColor(p['cycle'] ?? ''), fontSize: 10),
                ),
              ),
              const Spacer(),
              Text(
                p['delta'] ?? '',
                style: TextStyle(
                  color: positive ? AppTheme.sucesso : AppTheme.alerta,
                  fontSize: 12, fontWeight: FontWeight.w600,
                ),
              ),
            ]),
            const SizedBox(height: 10),
            Text(
              p['title'] ?? '',
              style: const TextStyle(color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Stack(children: [
              Container(height: 6, decoration: BoxDecoration(
                color: AppTheme.surface, borderRadius: BorderRadius.circular(3),
              )),
              FractionallySizedBox(
                widthFactor: prob / 100,
                child: Container(height: 6, decoration: BoxDecoration(
                  color: barColor, borderRadius: BorderRadius.circular(3),
                )),
              ),
            ]),
            const SizedBox(height: 6),
            Text(
              '${prob}% • Horizonte: ${p['horizonDays'] ?? '?'}d • Confiança: ${p['confidence'] ?? '?'}%',
              style: const TextStyle(color: AppTheme.textoSec, fontSize: 11),
            ),
            if (p['pattern'] != null && (p['pattern'] as String).isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(p['pattern'], style: const TextStyle(
                color: AppTheme.prophet, fontSize: 11, fontStyle: FontStyle.italic,
              )),
            ],
            const SizedBox(height: 4),
            const Row(
              children: [
                Icon(Icons.touch_app, color: AppTheme.textoSec, size: 12),
                SizedBox(width: 4),
                Text('Toque para detalhes', style: TextStyle(color: AppTheme.textoSec, fontSize: 10)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showPredictionDetail(dynamic p, int prob, Color barColor, bool positive) {
    final outcome = p['outcome'] as String? ?? 'pending';
    final outcomeLabel = outcome == 'true' ? '✅ Confirmada' : outcome == 'false' ? '❌ Recusada' : '⏳ Pendente';
    final outcomeColor = outcome == 'true' ? AppTheme.sucesso : outcome == 'false' ? AppTheme.alerta : AppTheme.warning;
    final modelUsed = p['model_used'] as String? ?? null;
    final sources = p['sources'] as String? ?? null;
    final createdAt = p['created_at'] as String? ?? null;
    final resolvedAt = p['resolved_at'] as String? ?? null;
    final brierScore = p['brier_score'];
    final description = p['description'] as String? ?? p['title'] as String? ?? '';

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bg,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(width: 40, height: 4, decoration: BoxDecoration(
                  color: AppTheme.surface, borderRadius: BorderRadius.circular(2),
                )),
              ),
              const SizedBox(height: 20),
              Text(p['title'] ?? '', style: const TextStyle(
                color: AppTheme.texto, fontSize: 18, fontWeight: FontWeight.bold,
              )),
              const SizedBox(height: 12),
              // Cycle + outcome chips
              Wrap(spacing: 8, runSpacing: 8, children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _cycleColor(p['cycle'] ?? '').withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(_cycleLabel(p['cycle'] ?? ''), style: TextStyle(color: _cycleColor(p['cycle'] ?? ''), fontSize: 12)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: outcomeColor.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6)),
                  child: Text(outcomeLabel, style: TextStyle(color: outcomeColor, fontSize: 12)),
                ),
              ]),
              const SizedBox(height: 20),
              // Probability bar
              Text('Probabilidade: $prob%', style: const TextStyle(color: AppTheme.textoSec, fontSize: 13)),
              const SizedBox(height: 8),
              Stack(children: [
                Container(height: 10, decoration: BoxDecoration(
                  color: AppTheme.surface, borderRadius: BorderRadius.circular(5),
                )),
                FractionallySizedBox(
                  widthFactor: prob / 100,
                  child: Container(height: 10, decoration: BoxDecoration(
                    color: barColor, borderRadius: BorderRadius.circular(5),
                  )),
                ),
              ]),
              const SizedBox(height: 8),
              Text('Confiança: ${p['confidence'] ?? '?'}%   Horizonte: ${p['horizonDays'] ?? '?'} dias',
                style: const TextStyle(color: AppTheme.textoSec, fontSize: 12)),
              const SizedBox(height: 16),
              // Description
              if (description.isNotEmpty && description != p['title']) ...[
                const Text('📝 Descrição', style: TextStyle(color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Text(description, style: const TextStyle(color: AppTheme.textoSec, fontSize: 13)),
                const SizedBox(height: 16),
              ],
              // How derived
              const Text('🧠 Como foi derivada', style: TextStyle(color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(8)),
                child: Text(
                  modelUsed != null
                      ? 'Modelo: $modelUsed${sources != null ? "\nFontes: $sources" : ""}'
                      : sources != null
                          ? 'Fontes: $sources'
                          : '🔮 Análise automatizada via Ollama/Groq',
                  style: const TextStyle(color: AppTheme.textoSec, fontSize: 12),
                ),
              ),
              const SizedBox(height: 16),
              // Dates
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('🗓️ Criada em', style: TextStyle(color: AppTheme.textoSec, fontSize: 11)),
                  const SizedBox(height: 2),
                  Text(createdAt ?? '—', style: const TextStyle(color: AppTheme.texto, fontSize: 12)),
                ])),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('✅ Resolvida em', style: TextStyle(color: AppTheme.textoSec, fontSize: 11)),
                  const SizedBox(height: 2),
                  Text(resolvedAt ?? '—', style: const TextStyle(color: AppTheme.texto, fontSize: 12)),
                ])),
              ]),
              if (brierScore != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(8)),
                  child: Row(children: [
                    const Text('📏 Brier Score', style: TextStyle(color: AppTheme.texto, fontSize: 13)),
                    const Spacer(),
                    Text(
                      '${(brierScore as num).toStringAsFixed(3)}',
                      style: TextStyle(color: (brierScore as num) <= 0.25 ? AppTheme.sucesso : (brierScore as num) <= 0.5 ? AppTheme.warning : AppTheme.alerta, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ]),
                ),
              ],
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Color _cycleColor(String cycle) {
    const colors = {
      'conflito': AppTheme.alerta,
      'economico': AppTheme.warning,
      'politico': AppTheme.primary,
      'social': AppTheme.sucesso,
      'tecnologico': Colors.blue,
      'ambiental': Colors.green,
      'cultural': Colors.orange,
    };
    return colors[cycle] ?? AppTheme.textoSec;
  }
}
