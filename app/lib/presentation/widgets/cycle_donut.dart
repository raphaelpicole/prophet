import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/indicator.dart';

class CycleDonut extends StatelessWidget {
  final Map<String, int> cycles;

  const CycleDonut({super.key, required this.cycles});

  @override
  Widget build(BuildContext context) {
    final total = cycles.values.fold(0, (a, b) => a + b);
    if (total == 0) return const SizedBox();

    final entries = cycles.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Ciclo Dominante',
            style: TextStyle(color: AppTheme.textoSec, fontSize: 12)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: entries.take(4).map((e) {
            final pct = (e.value / total * 100).round();
            return _cycleChip(e.key, pct);
          }).toList(),
        ),
      ],
    );
  }

  Widget _cycleChip(String cycle, int pct) {
    final color = _cycleColor(cycle);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8, height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            '$cycle $pct%',
            style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500),
          ),
        ],
      ),
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
