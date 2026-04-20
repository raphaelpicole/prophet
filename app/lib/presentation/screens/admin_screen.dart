import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService();
  late TabController _tabController;

  String? _selectedTable;
  List<Map<String, dynamic>> _tableData = [];
  Map<String, dynamic>? _stats;
  List<Map<String, dynamic>> _actions = [];
  List<Map<String, dynamic>> _logs = [];
  bool _loading = true;
  bool _loadingAction = false;
  int _page = 0;
  int _totalPages = 1;
  int _totalRows = 0;
  static const int _tablePageSize = 20;

  final List<Map<String, String>> _adminActions = [
    {'key': 'run_collect', 'label': '📡 Coleta RSS', 'description': 'Coleta novos artigos via RSS'},
    {'key': 'analyze_pending', 'label': '🧠 Analisar Artigos', 'description': 'Envia artigos pendentes para análise IA'},
    {'key': 'group_stories', 'label': '🔗 Agrupar Stories', 'description': 'Agrupar artigos em stories'},
    {'key': 'cleanup_logs', 'label': '🧹 Limpar Logs', 'description': 'Remove logs antigos do sistema'},
    {'key': 'get_status', 'label': '📊 Status do Sistema', 'description': 'Verificar status e métricas do sistema'},
  ];

  final List<String> _tables = [
    'raw_articles', 'stories', 'sources', 'predictions',
    'logs', 'analysis', 'regions', 'story_articles', 'entities',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAll();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.getAdminActions(),
        _api.getAdminLogs(),
        Future.value(null),
      ]);

      final actionsData = results[0] as Map<String, dynamic>?;
      final logsData = results[1] as List<dynamic>?;

      setState(() {
        _stats = actionsData?['stats'];
        _actions = actionsData?['actions'] != null
            ? (actionsData!['actions'] as Map<String, dynamic>).entries.map((e) => {
                'key': e.key,
                'label': e.value['label'],
                'description': e.value['description'],
              }).toList()
            : [];
        _logs = (logsData ?? []).cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadTable(String table, int page) async {
    setState(() { _loading = true; _selectedTable = table; _page = page; });
    try {
      final data = await _api.getAdminTable(table, page);
      setState(() {
        _tableData = (data['rows'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        final pagination = data['pagination'] as Map<String, dynamic>?;
        _totalPages = pagination?['pages'] ?? 1;
        _totalRows = pagination?['total'] ?? 0;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _runAction(String actionKey) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Confirmar execução', style: TextStyle(color: AppTheme.texto)),
        content: Text('Executar "$actionKey"?', style: const TextStyle(color: AppTheme.textoSec)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Executar'),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _loading = true);
    try {
      final result = await _api.runAdminAction(actionKey);
      final success = result['success'] == true;
      await _loadAll();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(success
              ? '✅ ${result['result'] ?? 'Ação executada'}'
              : '❌ ${result['error'] ?? 'Erro'}'),
          backgroundColor: success ? AppTheme.sucesso : AppTheme.alerta,
        ));
      }
    } catch (e) {
      setState(() { _loadingAction = false; _loading = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Erro: $e'),
          backgroundColor: AppTheme.alerta,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildStatsBar(),
            _buildTabBar(),
            Expanded(child: _buildTabContent()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
      child: Row(
        children: [
          const Icon(Icons.admin_panel_settings, color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          const Text('⚙️ Admin', style: TextStyle(
            color: AppTheme.texto, fontSize: 18, fontWeight: FontWeight.bold,
          )),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.textoSec, size: 20),
            onPressed: _loadAll,
          ),
        ],
      ),
    );
  }

  Widget _buildStatsBar() {
    if (_stats == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(10),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _statItem('📰', '${_stats!['articles']}', 'artigos'),
            _divider(),
            _statItem('🔥', '${_stats!['stories']}', 'stories'),
            _divider(),
            _statItem('📡', '${_stats!['sources']}', 'fontes'),
            _divider(),
            _statItem('⏳', '${_stats!['pending_analysis']}', 'pendentes'),
          ],
        ),
      ),
    );
  }

  Widget _statItem(String emoji, String value, String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(value, style: const TextStyle(color: AppTheme.texto, fontSize: 16, fontWeight: FontWeight.bold)),
              Text(label, style: const TextStyle(color: AppTheme.textoSec, fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _divider() => Container(width: 1, height: 28, color: AppTheme.surface);

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: TabBar(
        controller: _tabController,
        labelColor: AppTheme.primary,
        unselectedLabelColor: AppTheme.textoSec,
        indicatorColor: AppTheme.primary,
        indicatorSize: TabBarIndicatorSize.tab,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 12),
        tabs: const [
          Tab(text: '⚡ Ações'),
          Tab(text: '🗄️ Tabelas'),
          Tab(text: '📋 Logs'),
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    if (_loading && _stats == null) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2));
    }
    return TabBarView(
      controller: _tabController,
      children: [
        _buildActionsTab(),
        _buildTablesTab(),
        _buildLogsTab(),
      ],
    );
  }

  Widget _buildActionsTab() {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.4,
      ),
      itemCount: _adminActions.length,
      itemBuilder: (context, i) {
        final action = _adminActions[i];
        return _adminActionCard(action['key']!, action['label']!, action['description']!);
      },
    );
  }

  Widget _adminActionCard(String key, String label, String description) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.surface),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: _loadingAction ? null : () => _runAction(key),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label, style: const TextStyle(
                  color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.bold,
                )),
                const SizedBox(height: 6),
                Text(description, style: const TextStyle(
                  color: AppTheme.textoSec, fontSize: 11,
                ), maxLines: 2),
                if (_loadingAction) ...[
                  const SizedBox(height: 8),
                  const LinearProgressIndicator(color: AppTheme.primary, minHeight: 2),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTablesTab() {
    return Column(
      children: [
        // Table selector
        Container(
          height: 40,
          margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: ListView(scrollDirection: Axis.horizontal, children: _tables.map((t) {
            final active = _selectedTable == t;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () => _loadTable(t, 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: active ? AppTheme.primary : AppTheme.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: active ? AppTheme.primary : AppTheme.surface),
                  ),
                  child: Text(t, style: TextStyle(
                    color: active ? Colors.white : AppTheme.textoSec,
                    fontSize: 12,
                  )),
                ),
              ),
            );
          }).toList()),
        ),
        // Table data
        Expanded(
          child: _selectedTable == null
              ? Center(child: Text('Selecione uma tabela acima', style: TextStyle(color: AppTheme.textoSec)))
              : _loading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2))
                  : _tableData.isEmpty
                      ? Center(child: Text('Nenhum registro', style: TextStyle(color: AppTheme.textoSec)))
                      : Column(
                          children: [
                            // Pagination info
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              child: Row(
                                children: [
                                  Text('$_totalRows registros', style: TextStyle(color: AppTheme.textoSec, fontSize: 11)),
                                  const Spacer(),
                                  Text('pág ${_page + 1}/$_totalPages', style: TextStyle(color: AppTheme.textoSec, fontSize: 11)),
                                ],
                              ),
                            ),
                            // Table
                            Expanded(
                              child: ListView.builder(
                                padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                                itemCount: _tableData.length,
                                itemBuilder: (context, i) {
                                  final row = _tableData[i];
                                  return _tableRow(row);
                                },
                              ),
                            ),
                            // Pagination buttons
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.chevron_left, color: AppTheme.textoSec),
                                    onPressed: _page > 0 ? () => _loadTable(_selectedTable!, _page - 1) : null,
                                  ),
                                  const SizedBox(width: 16),
                                  IconButton(
                                    icon: const Icon(Icons.chevron_right, color: AppTheme.textoSec),
                                    onPressed: _page < _totalPages - 1 ? () => _loadTable(_selectedTable!, _page + 1) : null,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
        ),
      ],
    );
  }

  Widget _tableRow(Map<String, dynamic> row) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with id
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'id: ${_shortId(row['id'])}',
                  style: TextStyle(color: AppTheme.textoSec, fontSize: 10, fontFamily: 'monospace'),
                ),
              ),
              const Spacer(),
              Text(
                _timeAgo(row['created_at'] ?? row['updated_at'] ?? ''),
                style: TextStyle(color: AppTheme.textoSec, fontSize: 10),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Key-value pairs
          ...row.entries
              .where((e) => !['id', 'created_at', 'updated_at'].contains(e.key))
              .take(6)
              .map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 80,
                          child: Text('${e.key}:', style: TextStyle(
                            color: AppTheme.primary, fontSize: 11, fontFamily: 'monospace',
                          )),
                        ),
                        Expanded(child: Text(
                          _formatValue(e.value),
                          style: TextStyle(color: AppTheme.texto, fontSize: 11, fontFamily: 'monospace'),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        )),
                      ],
                    ),
                  )),
        ],
      ),
    );
  }

  Widget _buildLogsTab() {
    if (_logs.isEmpty) {
      return Center(child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.receipt_long, color: AppTheme.textoSec, size: 48),
          const SizedBox(height: 12),
          Text('Nenhum log disponível', style: TextStyle(color: AppTheme.textoSec)),
          const SizedBox(height: 12),
          TextButton(onPressed: _loadAll, child: const Text('Recarregar')),
        ],
      ));
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      itemCount: _logs.length,
      itemBuilder: (context, i) {
        final log = _logs[i];
        return _logRow(log);
      },
    );
  }

  Widget _logRow(Map<String, dynamic> log) {
    final level = log['level'] ?? 'info';
    final color = level == 'error' ? AppTheme.alerta
        : level == 'warn' ? AppTheme.warning
        : level == 'critical' ? Colors.red
        : AppTheme.sucesso;
    final icon = level == 'error' ? '🔴'
        : level == 'warn' ? '🟡'
        : level == 'critical' ? '🚨'
        : 'ℹ️';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(log['message'] ?? '', style: TextStyle(color: AppTheme.texto, fontSize: 12)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(level.toUpperCase(), style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 6),
                    Text(log['source'] ?? '', style: TextStyle(color: AppTheme.textoSec, fontSize: 10)),
                    const Spacer(),
                    Text(_timeAgo(log['created_at'] ?? ''), style: TextStyle(color: AppTheme.textoSec, fontSize: 10)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _shortId(dynamic id) {
    if (id == null) return '-';
    final s = id.toString();
    return s.length > 8 ? '${s.substring(0, 8)}…' : s;
  }

  String _formatValue(dynamic value) {
    if (value == null) return 'null';
    if (value is Map || value is List) {
      final s = value.toString();
      return s.length > 60 ? '${s.substring(0, 60)}…' : s;
    }
    final s = value.toString();
    return s.length > 80 ? '${s.substring(0, 80)}…' : s;
  }

  String _timeAgo(String isoDate) {
    if (isoDate.isEmpty) return '';
    try {
      final dt = DateTime.parse(isoDate);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return '${diff.inSeconds}s atrás';
      if (diff.inHours < 1) return '${diff.inMinutes}m atrás';
      if (diff.inDays < 1) return '${diff.inHours}h atrás';
      return '${diff.inDays}d atrás';
    } catch (e) { return isoDate.substring(0, 10); }
  }
}