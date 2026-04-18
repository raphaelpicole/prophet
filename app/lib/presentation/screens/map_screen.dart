import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/source.dart';
import '../../data/services/api_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final ApiService _api = ApiService();
  List<Region>? _regions;
  bool _loading = true;
  String _selectedRegion = 'Todos';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _loading = true; });
    try {
      final regions = await _api.getRegions().catchError((_) => <Region>[]);
      setState(() {
        _regions = regions.isEmpty ? _mockRegions() : regions;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _regions = _mockRegions();
        _loading = false;
      });
    }
  }

  List<Region> _mockRegions() {
    return [
      Region(id: '1', name: 'América do Sul', code: 'SAM'),
      Region(id: '2', name: 'Europa', code: 'EUR'),
      Region(id: '3', name: 'Oriente Médio', code: 'MID'),
      Region(id: '4', name: 'Ásia', code: 'ASI'),
      Region(id: '5', name: 'América do Norte', code: 'NAM'),
      Region(id: '6', name: 'Brasil', code: 'BRA', parentId: '1'),
      Region(id: '7', name: 'Estados Unidos', code: 'USA', parentId: '5'),
      Region(id: '8', name: 'Leste Europeu', code: 'EEU', parentId: '2'),
      Region(id: '9', name: 'Global', code: 'GLB'),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Icon(Icons.public, color: AppTheme.primary, size: 24),
                        const SizedBox(width: 8),
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
                      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      decoration: BoxDecoration(
                        color: AppTheme.card,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: _buildGlobe(),
                    ),
                  ),

                  // Region selector
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text('🌍 Região:', style: TextStyle(
                              color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
                            )),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                _selectedRegion,
                                style: const TextStyle(color: AppTheme.primary, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          height: 36,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: [
                              _regionChip('🌐', 'Todos', AppTheme.primary),
                              ..._regionChips(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildGlobe() {
    final selected = _regions?.where((r) => r.name == _selectedRegion).firstOrNull;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.public, color: AppTheme.primary, size: 80),
          const SizedBox(height: 16),
          Text(
            _selectedRegion == 'Todos'
                ? 'Globo Completo'
                : selected?.name ?? 'Selecione uma região',
            style: const TextStyle(color: AppTheme.texto, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            _selectedRegion == 'Todos'
                ? '${_regions?.length ?? 0} regiões configuradas'
                : 'Código: ${selected?.code ?? '—'}',
            style: const TextStyle(color: AppTheme.textoSec, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              '📍 Mapa interativo — em desenvolvimento',
              style: TextStyle(color: AppTheme.textoSec, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _regionChips() {
    final continents = _regions?.where((r) => r.parentId == null).toList() ?? [];
    return continents.map((r) => _regionChip(_flagFor(r.code), r.name, _regionColor(r.code))).toList();
  }

  Widget _regionChip(String flag, String label, Color color) {
    final isSelected = _selectedRegion == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() { _selectedRegion = label; }),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? color.withValues(alpha: 0.2) : AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? color : AppTheme.textoSec.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(flag, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? color : AppTheme.textoSec,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _regionColor(String code) {
    switch (code) {
      case 'SAM': return Colors.orange;
      case 'EUR': return Colors.blue;
      case 'MID': return Colors.red;
      case 'ASI': return Colors.purple;
      case 'NAM': return Colors.green;
      case 'AFR': return Colors.brown;
      case 'OCE': return Colors.cyan;
      default: return AppTheme.textoSec;
    }
  }

  String _flagFor(String code) {
    switch (code) {
      case 'SAM': return '🟠';
      case 'EUR': return '🔵';
      case 'MID': return '🔴';
      case 'ASI': return '🟣';
      case 'NAM': return '🟢';
      case 'AFR': return '🟤';
      case 'OCE': return '🔵';
      default: return '🌐';
    }
  }
}
