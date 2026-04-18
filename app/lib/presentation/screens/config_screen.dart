import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';

class ConfigScreen extends StatefulWidget {
  const ConfigScreen({super.key});

  @override
  State<ConfigScreen> createState() => _ConfigScreenState();
}

class _ConfigScreenState extends State<ConfigScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _logs = [];
  bool _loadingLogs = false;

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() => _loadingLogs = true);
    try {
      final r = await _api.getLogs().catchError((_) => null);
      if (mounted && r != null) setState(() { _logs = r['logs'] ?? []; _loadingLogs = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingLogs = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadLogs,
          color: AppTheme.primary,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  const Text('⚙️ Configurações', style: TextStyle(
                    color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
                  )),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.refresh, color: AppTheme.textoSec, size: 20),
                    onPressed: _loadLogs,
                  ),
                ],
              ),
              const SizedBox(height: 20),

              _section('📡 Monitor (últimas 24h)', [
                if (_loadingLogs)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2)),
                  )
                else if (_logs.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('Nenhum log recente', style: TextStyle(color: AppTheme.textoSec, fontSize: 13)),
                  )
                else
                  ..._logs.take(15).map((l) => _logItem(l)),
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
                _item('Artigos coletados', '263+', Icons.article_outlined),
                _item('Previsões ativas', '5', Icons.auto_awesome),
                _item('Última coleta', 'há ~30min', Icons.update),
                _item('Story count', '20', Icons.local_fire_department),
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
      ),
    );
  }

  Widget _logItem(Map<String, dynamic> log) {
    final color = log['level'] == 'error' ? AppTheme.alerta
        : log['level'] == 'warn' ? AppTheme.warning
        : log['level'] == 'critical' ? Colors.purple
        : AppTheme.textoSec;
    final icon = log['level'] == 'error' ? '🔴'
        : log['level'] == 'warn' ? '🟡'
        : log['level'] == 'critical' ? '🚨'
        : '🔵';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppTheme.surface, width: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(log['message'] ?? '', style: TextStyle(color: AppTheme.texto, fontSize: 12)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(log['source'] ?? '', style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 8),
                    Text(_timeAgo(DateTime.tryParse(log['created_at'] ?? '') ?? DateTime.now()),
                        style: const TextStyle(color: AppTheme.textoSec, fontSize: 10)),
                  ],
                ),
              ],
            ),
          ),
        ],
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

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'agora';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}