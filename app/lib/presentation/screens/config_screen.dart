import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class ConfigScreen extends StatelessWidget {
  const ConfigScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('⚙️ Configurações', style: TextStyle(
              color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
            )),
            const SizedBox(height: 20),

            _section('👤 Conta', [
              _item('Email', 'rapha@example.com', Icons.email_outlined),
              _item('Plano', 'Free', Icons.workspace_premium_outlined),
            ]),

            _section('🔔 Notificações', [
              _toggle('Previsões críticas', true),
              _toggle('Divergência narrativa', true),
              _toggle('Novas stories', false),
              _toggle('Resumo diário', true),
            ]),

            _section('📊 Preferências', [
              _item('Tema', 'Dark', Icons.dark_mode_outlined),
              _item('Fontes preferidas', 'G1, Folha, BBC...', Icons.rss_feed_outlined),
            ]),

            _section('🔮 Profeta', [
              _item('Horizonte mínimo', '30 dias', Icons.schedule),
              _item('Probabilidade mínima', '50%', Icons.percent),
            ]),

            _section('📈 Dados', [
              _item('Artigos coletados', '847', Icons.article_outlined),
              _item('Previsões ativas', '5', Icons.auto_awesome),
              _item('Última coleta', 'há 12 min', Icons.update),
            ]),

            const SizedBox(height: 20),
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.textoSec,
                side: const BorderSide(color: AppTheme.textoSec),
                padding: const EdgeInsets.all(16),
              ),
              onPressed: () {},
              child: const Text('Limpar cache'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Text(title, style: const TextStyle(
          color: AppTheme.textoSec, fontSize: 12, fontWeight: FontWeight.w600,
        )),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _item(String label, String value, IconData icon) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primary, size: 20),
      title: Text(label, style: const TextStyle(color: AppTheme.texto, fontSize: 14)),
      trailing: Text(value, style: const TextStyle(color: AppTheme.textoSec, fontSize: 13)),
      dense: true,
    );
  }

  Widget _toggle(String label, bool value) {
    return ListTile(
      title: Text(label, style: const TextStyle(color: AppTheme.texto, fontSize: 14)),
      trailing: Switch(
        value: value,
        onChanged: (_) {},
        activeColor: AppTheme.primary,
      ),
      dense: true,
    );
  }
}
