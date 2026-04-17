import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class AnalysisScreen extends StatelessWidget {
  const AnalysisScreen({super.key});

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
                  const Text('📊 Análise Narrativa', style: TextStyle(
                    color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
                  )),
                ],
              ),
            ),
            const Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.analytics_outlined, color: AppTheme.textoSec, size: 64),
                    SizedBox(height: 16),
                    Text('Análise Narrativa', style: TextStyle(color: AppTheme.texto, fontSize: 18)),
                    SizedBox(height: 8),
                    Text('Comparação de enquadramento entre fontes',
                        style: TextStyle(color: AppTheme.textoSec, fontSize: 14)),
                    SizedBox(height: 4),
                    Text('Em desenvolvimento...',
                        style: TextStyle(color: AppTheme.primary, fontSize: 13)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
