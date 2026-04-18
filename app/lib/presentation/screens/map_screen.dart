import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/constants.dart';
import '../../data/models/source.dart';
import '../../data/services/api_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final ApiService _api = ApiService();
  final MapController _mapController = MapController();
  List<Region>? _regions;
  bool _loading = true;
  String _selectedRegion = 'Todos';
  int _selectedTab = 0;

  static const _regionCoords = {
    'GLB': LatLng(20, 0),
    'SAM': LatLng(-15, -55),
    'BRA': LatLng(-14, -51),
    'NAM': LatLng(45, -100),
    'USA': LatLng(38, -97),
    'EUR': LatLng(50, 10),
    'ASI': LatLng(30, 105),
    'MID': LatLng(29, 47),
    'AFR': LatLng(0, 20),
    'OCE': LatLng(-25, 140),
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final regions = await _api.getRegions().catchError((_) => <Region>[]);
      if (mounted) setState(() {
        _regions = regions.isEmpty ? _mockRegions() : regions;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _regions = _mockRegions();
        _loading = false;
      });
    }
  }

  List<Region> _mockRegions() {
    return [
      Region(id: '1', name: '🌍 Global', code: 'GLB'),
      Region(id: '2', name: '🌎 América do Sul', code: 'SAM'),
      Region(id: '3', name: '🇧🇷 Brasil', code: 'BRA', parentId: '2'),
      Region(id: '4', name: '🌐 América do Norte', code: 'NAM'),
      Region(id: '5', name: '🇺🇸 Estados Unidos', code: 'USA', parentId: '4'),
      Region(id: '6', name: '🌍 Europa', code: 'EUR'),
      Region(id: '7', name: '🌏 Ásia', code: 'ASI'),
      Region(id: '8', name: '🟡 Oriente Médio', code: 'MID'),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildMap()),
            _buildRegionSelector(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Icon(Icons.public, color: AppTheme.primary, size: 24),
          const SizedBox(width: 8),
          const Text('🗺️ Mapa', style: TextStyle(
            color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
          )),
          const Spacer(),
          _tabBtn('Stories', 0),
          const Text(' | ', style: TextStyle(color: AppTheme.textoSec)),
          _tabBtn('🔮 Previsões', 1),
        ],
      ),
    );
  }

  Widget _tabBtn(String label, int tab) {
    final active = _selectedTab == tab;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = tab),
      child: Text(label, style: TextStyle(
        color: active ? AppTheme.primary : AppTheme.textoSec,
        fontSize: 13, fontWeight: active ? FontWeight.w600 : FontWeight.normal,
      )),
    );
  }

  Widget _buildMap() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.surface),
      ),
      clipBehavior: Clip.antiAlias,
      child: FlutterMap(
        mapController: _mapController,
        options: MapOptions(
          initialCenter: _regionCoords[_regionCode(_selectedRegion)] ?? const LatLng(20, 0),
          initialZoom: _zoom(_selectedRegion),
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${ApiConstants.mapboxToken}',
            additionalOptions: const {},
            userAgentPackageName: 'com.prophet.app',
          ),
          MarkerLayer(markers: _buildMarkers()),
        ],
      ),
    );
  }

  List<Marker> _buildMarkers() {
    final regions = _selectedRegion == 'Todos'
        ? _regions!.where((r) => r.parentId == null).toList()
        : _regions!.where((r) => r.name == _selectedRegion).toList();

    return regions
        .where((r) => _regionCoords.containsKey(r.code))
        .map((r) {
          final coords = _regionCoords[r.code]!;
          return Marker(
            point: coords,
            width: 90,
            height: 44,
            child: GestureDetector(
              onTap: () => _selectRegion(r),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _markerBg(r.code).withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white30),
                ),
                child: Text(r.name, style: const TextStyle(
                  color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600,
                )),
              ),
            ),
          );
        }).toList();
  }

  void _selectRegion(Region r) {
    setState(() => _selectedRegion = r.name);
    final coords = _regionCoords[r.code];
    if (coords != null) _mapController.move(coords, _zoom(r.name));
  }

  String _regionCode(String name) {
    const map = {
      '🌍 Global': 'GLB', '🌎 América do Sul': 'SAM', '🇧🇷 Brasil': 'BRA',
      '🌐 América do Norte': 'NAM', '🇺🇸 Estados Unidos': 'USA',
      '🌍 Europa': 'EUR', '🌏 Ásia': 'ASI', '🟡 Oriente Médio': 'MID',
    };
    return map[name] ?? 'GLB';
  }

  double _zoom(String name) {
    if (name == '🌍 Global') return 1.5;
    if (name == '🇧🇷 Brasil' || name == '🇺🇸 Estados Unidos') return 4;
    if (name.contains('América')) return 3;
    return 2;
  }

  Color _markerBg(String code) {
    switch (code) {
      case 'SAM': return Colors.orange;
      case 'EUR': return Colors.blue;
      case 'MID': return Colors.red;
      case 'ASI': return Colors.purple;
      case 'NAM': return Colors.teal;
      case 'BRA': return Colors.green;
      case 'GLB': return AppTheme.primary;
      default: return AppTheme.primary;
    }
  }

  Widget _buildRegionSelector() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
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
              child: Text(_selectedRegion, style: const TextStyle(color: AppTheme.primary, fontSize: 12)),
            ),
          ]),
          const SizedBox(height: 10),
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _chip('🌐', 'Todos', 'GLB', AppTheme.primary),
                ...(_regions ?? []).where((r) => r.parentId == null).map((r) => _chip(_flag(r.code), r.name, r.code, _regionColor(r.code))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String flag, String label, String code, Color color) {
    final isSelected = _selectedRegion == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          setState(() => _selectedRegion = label);
          if (_regionCoords.containsKey(code)) {
            _mapController.move(_regionCoords[code]!, _zoom(label));
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? color.withValues(alpha: 0.2) : AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isSelected ? color : AppTheme.surface),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(flag, style: const TextStyle(fontSize: 12)),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(
              color: isSelected ? color : AppTheme.textoSec,
              fontSize: 12, fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            )),
          ]),
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
      case 'NAM': return Colors.teal;
      case 'BRA': return Colors.green;
      case 'GLB': return AppTheme.primary;
      default: return AppTheme.textoSec;
    }
  }

  String _flag(String code) {
    switch (code) {
      case 'SAM': return '🟠';
      case 'EUR': return '🔵';
      case 'MID': return '🔴';
      case 'ASI': return '🟣';
      case 'NAM': return '🟢';
      case 'BRA': return '🇧🇷';
      case 'GLB': return '🌐';
      default: return '🌐';
    }
  }
}
