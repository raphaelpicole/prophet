import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';
import '../widgets/animated_button.dart';

class ProphetScreen extends StatefulWidget {
  const ProphetScreen({super.key});

  @override
  State<ProphetScreen> createState() => _ProphetScreenState();
}

class _ProphetScreenState extends State<ProphetScreen>
    with TickerProviderStateMixin {
  final ApiService _api = ApiService();
  String _selectedCycle = 'Todos';
  final List<String> _cycles = [
    'Todos', 'conflito', 'economico', 'politico',
    'social', 'tecnologico', 'ambiental', 'cultural',
  ];
  late AnimationController _sheetController;

  Future<List<dynamic>> _loadPredictions() async {
    final cycle = _selectedCycle == 'Todos' ? null : _selectedCycle;
    return await _api.getPredictions(cycle: cycle).catchError((_) => []);
  }

  void _setCycle(String cycle) {
    setState(() => _selectedCycle = cycle);
  }

  @override
  void initState() {
    super.initState();
    _sheetController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _sheetController.dispose();
    super.dispose();
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
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.auto_awesome,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            'Profeta',
            style: TextStyle(
              color: AppTheme.texto,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
            ),
          ),
          const Spacer(),
          AnimatedButton(
            onTap: () => setState(() {}),
            scaleOnPress: 0.9,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.card,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.refresh, color: AppTheme.textoSec, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackRecord() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.card,
            AppTheme.cardLight.withValues(alpha: 0.3),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primary.withValues(alpha: 0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.08),
            blurRadius: 16,
            spreadRadius: 0,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.warning.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.emoji_events,
                  color: AppTheme.warning,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'Track Record',
                style: TextStyle(
                  color: AppTheme.texto,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.2,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.sucesso.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: AppTheme.sucesso,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'Ativo',
                      style: TextStyle(
                        color: AppTheme.sucesso,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _dashboardStat(
                value: '142',
                label: 'previsões',
                icon: Icons.analytics_outlined,
                color: AppTheme.primary,
              ),
              Container(
                width: 1,
                height: 40,
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
              _dashboardStat(
                value: '63%',
                label: 'corretas',
                icon: Icons.trending_up,
                color: AppTheme.sucesso,
              ),
              Container(
                width: 1,
                height: 40,
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
              _dashboardStat(
                value: '0.21',
                label: 'Brier',
                icon: Icons.scoreboard_outlined,
                color: AppTheme.warning,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _dashboardStat({
    required String value,
    required String label,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    color: AppTheme.texto,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.3,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    color: AppTheme.textoSec,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCycleFilter() {
    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
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
            child: CircularProgressIndicator(
              color: AppTheme.primary,
              strokeWidth: 2,
            ),
          );
        }

        final predictions = snapshot.data ?? [];

        if (predictions.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.card,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.psychology_outlined,
                    color: AppTheme.textoSec,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Nenhuma previsão disponível',
                  style: TextStyle(
                    color: AppTheme.textoSec,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 12),
                PrimaryAnimatedButton(
                  label: 'Tentar novamente',
                  onTap: () => setState(() {}),
                  icon: Icons.refresh,
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
          itemCount: predictions.length + 1,
          itemBuilder: (context, i) {
            if (i == 0) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12, top: 4),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppTheme.alerta.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.warning_amber,
                        color: AppTheme.alerta,
                        size: 14,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Previsões Ativas',
                      style: TextStyle(
                        color: AppTheme.texto,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${predictions.length} ativas',
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
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
      child: AnimatedButton(
        onTap: () => _setCycle(cycle),
        scaleOnPress: 0.95,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: active
              ? color.withValues(alpha: 0.18)
              : AppTheme.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? color : AppTheme.surface,
            width: active ? 1.5 : 1,
          ),
        ),
        child: Text(
          cycle == 'Todos' ? 'Todos' : _cycleLabel(cycle),
          style: TextStyle(
            color: active ? color : AppTheme.textoSec,
            fontSize: 12,
            fontWeight: active ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  String _cycleLabel(String cycle) {
    const labels = {
      'conflito': 'Conflito',
      'economico': 'Econômico',
      'politico': 'Político',
      'social': 'Social',
      'tecnologico': 'Tech',
      'ambiental': 'Ambiental',
      'cultural': 'Cultural',
    };
    return labels[cycle] ?? cycle;
  }

  Widget _predictionCard(dynamic p) {
    final prob = (p['probability'] is num
            ? (p['probability'] as num).toDouble()
            : (double.tryParse(p['probability'].toString()) ?? 0.5) *
                100)
        .toInt();
    final barColor = prob >= 70
        ? AppTheme.alerta
        : prob >= 50
            ? AppTheme.warning
            : AppTheme.sucesso;
    final positive = p['positive'] as bool? ?? false;
    final cycleColor = _cycleColor(p['cycle'] ?? '');

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AnimatedButton(
        onTap: () => _showPredictionDetail(p, prob, barColor, positive),
        scaleOnPress: 0.98,
        padding: EdgeInsets.zero,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.card,
            AppTheme.cardLight.withValues(alpha: 0.2),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: barColor.withValues(alpha: 0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: barColor.withValues(alpha: 0.1),
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
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: barColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: barColor.withValues(alpha: 0.25),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        prob >= 70
                            ? Icons.priority_high
                            : Icons.info_outline,
                        color: barColor,
                        size: 12,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        prob >= 70 ? 'Crítico' : 'Aviso',
                        style: TextStyle(
                          color: barColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: cycleColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _cycleLabel(p['cycle'] ?? ''),
                    style: TextStyle(
                      color: cycleColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      positive
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      color: positive ? AppTheme.sucesso : AppTheme.alerta,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      p['delta'] ?? '',
                      style: TextStyle(
                        color:
                            positive ? AppTheme.sucesso : AppTheme.alerta,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              p['title'] ?? '',
              style: const TextStyle(
                color: AppTheme.texto,
                fontSize: 15,
                fontWeight: FontWeight.w700,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 12),
            // Progress bar with glow
            Stack(
              children: [
                Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                FractionallySizedBox(
                  widthFactor: prob / 100,
                  child: Container(
                    height: 8,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          barColor.withValues(alpha: 0.8),
                          barColor,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: [
                        BoxShadow(
                          color: barColor.withValues(alpha: 0.4),
                          blurRadius: 6,
                          spreadRadius: 0,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  '$prob% probabilidade',
                  style: TextStyle(
                    color: barColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.schedule,
                      color: AppTheme.textoSec,
                      size: 11,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      '${p['horizonDays'] ?? '?'}d',
                      style: const TextStyle(
                        color: AppTheme.textoSec,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(
                      Icons.verified,
                      color: AppTheme.textoSec,
                      size: 11,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      '${p['confidence'] ?? '?'}%',
                      style: const TextStyle(
                        color: AppTheme.textoSec,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            if (p['pattern'] != null &&
                (p['pattern'] as String).isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.prophet.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppTheme.prophet.withValues(alpha: 0.2),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.auto_awesome,
                      color: AppTheme.prophet.withValues(alpha: 0.7),
                      size: 12,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        p['pattern'],
                        style: TextStyle(
                          color: AppTheme.prophet.withValues(alpha: 0.9),
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (p['historical_analogue'] != null &&
                (p['historical_analogue'] as String).isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.warning.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.history,
                      color: AppTheme.warning.withValues(alpha: 0.8),
                      size: 12,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Analogia: ${p["historical_analogue"]}',
                        style: TextStyle(
                          color: AppTheme.warning.withValues(alpha: 0.9),
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.touch_app,
                  color: AppTheme.textoSec.withValues(alpha: 0.6),
                  size: 12,
                ),
                const SizedBox(width: 4),
                Text(
                  'Toque para detalhes',
                  style: TextStyle(
                    color: AppTheme.textoSec.withValues(alpha: 0.6),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
  }

  void _showPredictionDetail(
    dynamic p,
    int prob,
    Color barColor,
    bool positive,
  ) {
    final outcome = p['outcome'] as String? ?? 'pending';
    final outcomeLabel = outcome == 'true'
        ? 'Confirmada'
        : outcome == 'false'
            ? 'Recusada'
            : 'Pendente';
    final outcomeColor = outcome == 'true'
        ? AppTheme.sucesso
        : outcome == 'false'
            ? AppTheme.alerta
            : AppTheme.warning;
    final modelUsed = p['model_used'] as String?;
    final sources = p['sources'] as String?;
    final createdAt = p['created_at'] as String?;
    final resolvedAt = p['resolved_at'] as String?;
    final brierScore = p['brier_score'];
    final description =
        p['description'] as String? ?? p['title'] as String? ?? '';

    _sheetController.forward(from: 0);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      transitionAnimationController: _sheetController,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.3,
        maxChildSize: 0.92,
        expand: false,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: AppTheme.bg,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
            controller: scrollController,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Title
                Text(
                  p['title'] ?? '',
                  style: const TextStyle(
                    color: AppTheme.texto,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 16),

                // Chips
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _detailChip(
                      _cycleLabel(p['cycle'] ?? ''),
                      _cycleColor(p['cycle'] ?? ''),
                    ),
                    _detailChip(outcomeLabel, outcomeColor),
                    _detailChip(
                      '$prob% prob.',
                      barColor,
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Probability bar
                const Text(
                  'Probabilidade',
                  style: TextStyle(
                    color: AppTheme.textoSec,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 10),
                Stack(
                  children: [
                    Container(
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    FractionallySizedBox(
                      widthFactor: prob / 100,
                      child: Container(
                        height: 12,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              barColor.withValues(alpha: 0.7),
                              barColor,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(6),
                          boxShadow: [
                            BoxShadow(
                              color: barColor.withValues(alpha: 0.4),
                              blurRadius: 8,
                              spreadRadius: 0,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Confiança: ${p['confidence'] ?? '?'}%   Horizonte: ${p['horizonDays'] ?? '?'} dias',
                  style: const TextStyle(
                    color: AppTheme.textoSec,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 20),

                // Description
                if (description.isNotEmpty && description != p['title']) ...[
                  _sectionHeader(Icons.description_outlined, 'Descrição'),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppTheme.surface,
                        width: 1,
                      ),
                    ),
                    child: Text(
                      description,
                      style: const TextStyle(
                        color: AppTheme.textoSec,
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // How derived
                _sectionHeader(Icons.psychology_outlined, 'Como foi derivada'),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.surface,
                      width: 1,
                    ),
                  ),
                  child: Text(
                    modelUsed != null
                        ? 'Modelo: $modelUsed${sources != null ? "\nFontes: $sources" : ""}'
                        : sources != null
                            ? 'Fontes: $sources'
                            : 'Análise automatizada via Ollama/Groq',
                    style: const TextStyle(
                      color: AppTheme.textoSec,
                      fontSize: 12,
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Dates
                Row(
                  children: [
                    Expanded(
                      child: _dateBox(
                        Icons.calendar_today,
                        'Criada em',
                        createdAt ?? '—',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _dateBox(
                        Icons.check_circle_outline,
                        'Resolvida em',
                        resolvedAt ?? '—',
                      ),
                    ),
                  ],
                ),

                if (brierScore != null) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppTheme.surface,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: (brierScore) <= 0.25
                                ? AppTheme.sucesso.withValues(alpha: 0.15)
                                : (brierScore as num) <= 0.5
                                    ? AppTheme.warning.withValues(alpha: 0.15)
                                    : AppTheme.alerta.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.scoreboard_outlined,
                            color: (brierScore) <= 0.25
                                ? AppTheme.sucesso
                                : (brierScore) <= 0.5
                                    ? AppTheme.warning
                                    : AppTheme.alerta,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Brier Score',
                          style: TextStyle(
                            color: AppTheme.texto,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${(brierScore).toStringAsFixed(3)}',
                          style: TextStyle(
                            color: (brierScore) <= 0.25
                                ? AppTheme.sucesso
                                : (brierScore) <= 0.5
                                    ? AppTheme.warning
                                    : AppTheme.alerta,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Historical analogue
                if (p['historical_analogue'] != null &&
                    (p['historical_analogue'] as String).isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _sectionHeader(Icons.history, 'Analogia Histórica'),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppTheme.warning.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppTheme.warning.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.history,
                                color: AppTheme.warning,
                                size: 16,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                p['historical_analogue'] as String? ?? '',
                                style: const TextStyle(
                                  color: AppTheme.warning,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (p['reasoning'] != null &&
                            (p['reasoning'] as String).isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            p['reasoning'] as String? ?? '',
                            style: const TextStyle(
                              color: AppTheme.textoSec,
                              fontSize: 12,
                              height: 1.5,
                            ),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: _confidenceColor(
                                  p['confidence'] as String? ?? 'medium',
                                ).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Confiança: ${p["confidence"] ?? "medium"}',
                                style: TextStyle(
                                  color: _confidenceColor(
                                    p['confidence'] as String? ?? 'medium',
                                  ),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Horizonte: ${p["horizon_days"] ?? 60} dias',
                              style: const TextStyle(
                                color: AppTheme.textoSec,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: AppTheme.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppTheme.primary, size: 14),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: AppTheme.texto,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _dateBox(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.surface,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppTheme.textoSec, size: 12),
              const SizedBox(width: 4),
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.textoSec,
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.texto,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: color.withValues(alpha: 0.25),
          width: 1,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
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

  Color _confidenceColor(String confidence) {
    switch (confidence) {
      case 'high': return AppTheme.sucesso;
      case 'medium': return AppTheme.warning;
      case 'low': return AppTheme.alerta;
      default: return AppTheme.textoSec;
    }
  }
}
