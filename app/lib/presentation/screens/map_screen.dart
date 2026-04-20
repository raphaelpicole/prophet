import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/constants.dart';
import '../../data/models/source.dart';
import '../../data/models/story.dart';
import '../../data/services/api_service.dart';
import '../../data/services/mock_service.dart';
import 'article_detail_screen.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final ApiService _api = ApiService();
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();
  List<Region>? _regions;
  List<Story>? _stories;
  bool _loading = true;
  bool _searching = false;
  String _selectedRegion = 'Todos';
  int _selectedTab = 0;
  String _searchQuery = '';
  List<Story> _searchResults = [];

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

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        _api.getRegions().catchError((_) => <Region>[]),
        _api.getStories(limit: 50).catchError((_) => <Story>[]),
      ]);
      if (mounted) setState(() {
        _regions = (results[0] as List<Region>).isEmpty ? _mockRegions() : results[0] as List<Region>;
        _stories = (results[1] as List<Story>).isEmpty ? MockService.getStories() : results[1] as List<Story>;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _regions = _mockRegions();
        _stories = MockService.getStories();
        _loading = false;
      });
    }
  }

  Future<void> _search(String query) async {
    if (query.length < 2) {
      setState(() { _searchResults = []; _searching = false; });
      return;
    }
    setState(() { _searching = true; });
    try {
      final results = await _api.getStories(search: query, limit: 10).catchError((_) => <Story>[]);
      if (mounted) setState(() {
        _searchResults = results.isEmpty ? _mockSearch(query) : results;
        _searching = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _searchResults = _mockSearch(query);
        _searching = false;
      });
    }
  }

  List<Story> _mockSearch(String query) {
    final q = query.toLowerCase();
    return (_stories ?? [])
        .where((s) => s.title.toLowerCase().contains(q) || (s.summary ?? '').toLowerCase().contains(q))
        .take(5)
        .toList();
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
            if (_selectedTab == 0) _buildSearchBar(),
            Expanded(child: _selectedTab == 0 ? _buildMapTab() : _buildPredictionsTab()),
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

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: TextField(
        controller: _searchController,
        onChanged: (v) {
          setState(() => _searchQuery = v);
          _search(v);
        },
        style: const TextStyle(color: AppTheme.texto, fontSize: 14),
        decoration: InputDecoration(
          hintText: '🔍 Buscar notícias no mapa...',
          hintStyle: const TextStyle(color: AppTheme.textoSec, fontSize: 14),
          prefixIcon: const Icon(Icons.search, color: AppTheme.textoSec, size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, color: AppTheme.textoSec, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    setState(() { _searchQuery = ''; _searchResults = []; });
                  },
                )
              : null,
          filled: true,
          fillColor: AppTheme.card,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.surface, width: 1),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
          ),
        ),
      ),
    );
  }

  Widget _buildMapTab() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    if (_searchQuery.isNotEmpty || _searchResults.isNotEmpty) {
      return _buildSearchResults();
    }

    return Column(
      children: [
        Expanded(child: _buildMap()),
        _buildRegionInfo(),
      ],
    );
  }

  Widget _buildSearchResults() {
    if (_searching) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2),
            SizedBox(height: 12),
            Text('Buscando...', style: TextStyle(color: AppTheme.textoSec, fontSize: 13)),
          ],
        ),
      );
    }

    if (_searchResults.isEmpty && _searchQuery.length >= 2) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off, color: AppTheme.textoSec, size: 48),
            const SizedBox(height: 12),
            Text(
              'Nenhum resultado para "$_searchQuery"',
              style: const TextStyle(color: AppTheme.textoSec, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      itemCount: _searchResults.length,
      itemBuilder: (ctx, i) {
        final story = _searchResults[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(10),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            leading: CircleAvatar(
              backgroundColor: AppTheme.primary.withValues(alpha: 0.2),
              radius: 18,
              child: Text('${story.hotness}', style: const TextStyle(
                color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.bold,
              )),
            ),
            title: Text(story.title, style: const TextStyle(
              color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w500,
            )),
            subtitle: Row(
              children: [
                Text(story.mainSubject, style: const TextStyle(color: AppTheme.textoSec, fontSize: 11)),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(_cycleLabel(story.cycle), style: const TextStyle(
                    color: AppTheme.primary, fontSize: 9, fontWeight: FontWeight.w600,
                  )),
                ),
              ],
            ),
            trailing: const Icon(Icons.chevron_right, color: AppTheme.textoSec, size: 20),
            onTap: () => _openArticle(story),
          ),
        );
      },
    );
  }

  void _openArticle(Story story) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ArticleDetailScreen(story: story),
      ),
    );
  }

  String _cycleLabel(String cycle) {
    const labels = {
      'conflito': '⚔️ Conflito',
      'economico': '📊 Economia',
      'politico': '🏛️ Político',
      'social': '👥 Social',
      'tecnologico': '⚡ Tech',
      'ambiental': '🌱 Ambiental',
      'cultural': '🎭 Cultural',
    };
    return labels[cycle] ?? cycle;
  }

  Widget _buildMap() {
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
          CircleLayer(
            circles: _buildHeatmapCircles(),
          ),
          MarkerLayer(markers: _buildMarkers()),
        ],
      ),
    );
  }

  static const _regionKeywords = {
    'SAM': ['Brasil', 'Argentina', 'Chile', 'Peru', 'Colômbia', 'Venezuela', 'Equador', 'Bolívia', 'Uruguai', 'Paraguai', 'América do Sul', 'Sul-America'],
    'NAM': ['Estados Unidos', 'Canadá', 'México', 'EUA', 'USA', 'América do Norte', 'Norte-America'],
    'EUR': ['Europa', 'União Europeia', 'Reino Unido', 'França', 'Alemanha', 'Itália', 'Espanha', 'Portugal', 'UE'],
    'ASI': ['China', 'Japão', 'Índia', 'Coreia', 'Taiwan', 'Hong Kong', 'Ásia', 'Asiático'],
    'MID': ['Oriente Médio', 'Iraque', 'Irã', 'Israel', 'Palestina', 'Arábia', 'Líbano', 'Síria', 'Emirados'],
    'AFR': ['África', 'Nigéria', 'Egito', 'África do Sul', 'Marrocos', 'Argélia'],
    'OCE': ['Oceania', 'Austrália', 'Nova Zelândia', 'Indonésia', 'Papua'],
  };

  static const _regionCycleWeights = {
    'SAM': {'color': Colors.orange, 'baseRadius': 50.0, 'maxRadius': 100.0},
    'NAM': {'color': Colors.teal, 'baseRadius': 40.0, 'maxRadius': 90.0},
    'EUR': {'color': Colors.blue, 'baseRadius': 35.0, 'maxRadius': 85.0},
    'ASI': {'color': Colors.purple, 'baseRadius': 30.0, 'maxRadius': 80.0},
    'MID': {'color': Colors.red, 'baseRadius': 30.0, 'maxRadius': 75.0},
    'AFR': {'color': Colors.amber, 'baseRadius': 25.0, 'maxRadius': 60.0},
    'OCE': {'color': Colors.cyan, 'baseRadius': 20.0, 'maxRadius': 50.0},
  };

  int _countForRegion(String code) {
    if (_stories == null || _stories!.isEmpty) return 0;
    final keywords = _regionKeywords[code] ?? [];
    return _stories!.where((s) {
      final t = s.title.toLowerCase();
      return keywords.any((k) => t.contains(k.toLowerCase()));
    }).length;
  }

  List<CircleMarker> _buildHeatmapCircles() {
    final codes = ['SAM', 'NAM', 'EUR', 'ASI', 'MID', 'AFR', 'OCE'];
    int maxCount = 1;
    final counts = <String, int>{};
    for (final code in codes) {
      final c = _countForRegion(code);
      counts[code] = c;
      if (c > maxCount) maxCount = c;
    }

    return codes.map((code) {
      final count = counts[code]!;
      final cfg = _regionCycleWeights[code]!;
      final baseR = (cfg['baseRadius'] as num).toDouble();
      final maxR = (cfg['maxRadius'] as num).toDouble();
      final intensity = maxCount > 0 ? (count / maxCount) : 0.0;
      final radius = baseR + (maxR - baseR) * intensity;
      final opacity = count > 0 ? (0.20 + 0.45 * intensity) : 0.0;
      final color = cfg['color'] as Color;

      return CircleMarker(
        point: _regionCoords[code] ?? const LatLng(0, 0),
        radius: radius,
        color: color.withValues(alpha: opacity),
        borderColor: color.withValues(alpha: count > 0 ? 0.7 : 0),
        borderStrokeWidth: count > 0 ? 1.5 : 0,
      );
    }).toList();
  }

  List<Marker> _buildMarkers() {
    final regions = _selectedRegion == 'Todos'
        ? (_regions ?? []).where((r) => r.parentId == null).toList()
        : (_regions ?? []).where((r) => r.name == _selectedRegion).toList();

    return regions
        .where((r) => _regionCoords.containsKey(r.code))
        .map((r) {
          final coords = _regionCoords[r.code]!;
          return Marker(
            point: coords,
            width: 100,
            height: 50,
            child: GestureDetector(
              onTap: () => _onMarkerTap(r),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(
                  color: _regionColor(r.code).withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white30),
                  boxShadow: [BoxShadow(
                    color: _regionColor(r.code).withValues(alpha: 0.4),
                    blurRadius: 6,
                    spreadRadius: 1,
                  )],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(r.name, style: const TextStyle(
                      color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600,
                    )),
                    Text(_regionArticleCount(r.code), style: const TextStyle(
                      color: Colors.white70, fontSize: 9,
                    )),
                  ],
                ),
              ),
            ),
          );
        }).toList();
  }

  String _regionArticleCount(String code) {
    final count = _regionStoriesForCode(code).length;
    if (count == 0) return '';
    return '$count ${count == 1 ? 'story' : 'stories'}';
  }

  void _onMarkerTap(Region r) {
    setState(() => _selectedRegion = r.name);
    final coords = _regionCoords[r.code];
    if (coords != null) _mapController.move(coords, _zoom(r.name));
    // Also load stories for this region
    _loadStoriesForRegion(r.code);
  }

  Future<void> _loadStoriesForRegion(String code) async {
    // Convert region code to API format
    String? apiRegion;
    if (code == 'SAM') apiRegion = 'SAM';
    else if (code == 'NAM') apiRegion = 'US';
    else if (code == 'EUR') apiRegion = 'EU';
    else if (code == 'ASI') apiRegion = 'CN';
    else if (code == 'MID') apiRegion = 'ME';
    else if (code == 'AFR') apiRegion = 'AF';
    else if (code == 'OCE') apiRegion = 'AS';
    else if (code == 'GLB') apiRegion = null;

    try {
      final stories = await _api.getStories(region: apiRegion, limit: 20);
      if (mounted) setState(() => _stories = stories);
    } catch (_) {}
  }

  Widget _buildRegionInfo() {
    final regionStories = _regionStoriesForCode(_regionCode(_selectedRegion));
    if (regionStories.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(_selectedRegion, style: const TextStyle(
                color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
              )),
              const Spacer(),
              Text('${regionStories.length} stories', style: const TextStyle(
                color: AppTheme.textoSec, fontSize: 11,
              )),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: regionStories.length.clamp(0, 5),
              itemBuilder: (ctx, i) {
                final s = regionStories[i];
                return Container(
                  width: 160,
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.title, style: const TextStyle(
                        color: AppTheme.texto, fontSize: 10, fontWeight: FontWeight.w500,
                      ), maxLines: 2, overflow: TextOverflow.ellipsis),
                      const Spacer(),
                      Row(
                        children: [
                          Text('${s.hotness}', style: const TextStyle(
                            color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.bold,
                          )),
                          const SizedBox(width: 4),
                          Text(_cycleEmoji(s.cycle), style: const TextStyle(fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  List<Story> _regionStoriesForCode(String code) {
    if (_stories == null || _stories!.isEmpty) return [];
    final keywords = _regionKeywords[code] ?? [];
    if (keywords.isEmpty) return _stories!;
    return _stories!.where((s) {
      final t = s.title.toLowerCase();
      return keywords.any((k) => t.contains(k.toLowerCase()));
    }).toList();
  }

  String _cycleEmoji(String cycle) {
    const map = {'conflito': '⚔️', 'economico': '📊', 'politico': '🏛️', 'social': '👥', 'tecnologico': '⚡', 'ambiental': '🌱', 'cultural': '🎭'};
    return map[cycle] ?? '📰';
  }

  Widget _buildPredictionsTab() {
    final predictions = _mockPredictions();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: predictions.length,
      itemBuilder: (ctx, i) {
        final p = predictions[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: (p['positive'] == true ? Colors.green : Colors.orange).withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text('${p['probability']}%', style: const TextStyle(
                    color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.bold,
                  )),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p['title'] ?? '', style: const TextStyle(
                      color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w500,
                    )),
                    const SizedBox(height: 4),
                    Text(p['pattern'] ?? '', style: const TextStyle(
                      color: AppTheme.textoSec, fontSize: 11,
                    )),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(p['delta'] ?? '', style: TextStyle(
                          color: p['positive'] == true ? Colors.green : Colors.orange,
                          fontSize: 11, fontWeight: FontWeight.w600,
                        )),
                        const SizedBox(width: 8),
                        Text('⏱ ${p['horizonDays']} dias', style: const TextStyle(
                          color: AppTheme.textoSec, fontSize: 10,
                        )),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _cycleColor(p['cycle'] ?? '').withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(_cycleLabel(p['cycle'] ?? ''), style: TextStyle(
                  color: _cycleColor(p['cycle'] ?? ''), fontSize: 10, fontWeight: FontWeight.w600,
                )),
              ),
            ],
          ),
        );
      },
    );
  }

  Color _cycleColor(String cycle) {
    const colors = {
      'conflito': Colors.red,
      'economico': Colors.amber,
      'politico': Colors.blue,
      'social': Colors.green,
      'tecnologico': Colors.purple,
      'ambiental': Colors.teal,
      'cultural': Colors.orange,
    };
    return colors[cycle] ?? AppTheme.textoSec;
  }

  List<dynamic> _mockPredictions() {
    return [
      {'title': 'Conflito armado — Oriente Médio', 'cycle': 'conflito', 'probability': 78, 'delta': '+13%', 'positive': false, 'pattern': '"Escalada → Conflito" Etapa 3/4', 'horizonDays': 90},
      {'title': 'Crise econômica — Argentina', 'cycle': 'economico', 'probability': 62, 'delta': '+5%', 'positive': false, 'pattern': '"Resgate FMI → Estabilização parcial"', 'horizonDays': 180},
      {'title': 'Mudança de governo — Hungria', 'cycle': 'politico', 'probability': 85, 'delta': '-8%', 'positive': true, 'pattern': 'Resultado: ✅ CORRETO', 'horizonDays': 365},
      {'title': 'Avanço viral — IA generativa', 'cycle': 'tecnologico', 'probability': 91, 'delta': '+22%', 'positive': true, 'pattern': '"Adoção acelerada → Onda de conteúdo"', 'horizonDays': 30},
      {'title': 'Onda de calor — Europa', 'cycle': 'ambiental', 'probability': 73, 'delta': '+8%', 'positive': false, 'pattern': '"La Niña → Amplitude térmica"', 'horizonDays': 60},
    ];
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
      default: return AppTheme.primary;
    }
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