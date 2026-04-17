import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Text('🗺️ Mapa', style: TextStyle(
                    color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
                  )),
                  const Spacer(),
                  TextButton(
                    onPressed: () {},
                    child: const Text('Stories', style: TextStyle(color: AppTheme.primary)),
                  ),
                  const Text('|', style: TextStyle(color: AppTheme.textoSec)),
                  TextButton(
                    onPressed: () {},
                    child: const Text('🔮 Previsões', style: TextStyle(color: AppTheme.textoSec)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.public, color: AppTheme.textoSec, size: 64),
                      SizedBox(height: 16),
                      Text('Mapa Geopolítico', style: TextStyle(color: AppTheme.texto, fontSize: 18)),
                      SizedBox(height: 8),
                      Text('Visualização interativa por região\nEm desenvolvimento...',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppTheme.textoSec, fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ),
            // Region chips
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _regionChip('🔴 Oriente Médio', AppTheme.alerta),
                  _regionChip('🟡 Europa', Colors.amber),
                  _regionChip('🟠 América do Sul', Colors.orange),
                  _regionChip('🔵 Ásia', Colors.blue),
                  _regionChip('🟢 Brasil', AppTheme.sucesso),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _regionChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 12)),
    );
  }
}
