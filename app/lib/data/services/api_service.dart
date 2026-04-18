import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/story.dart';
import '../models/indicator.dart';
import '../models/source.dart';
import '../../core/constants/constants.dart';

class ApiService {
  final http.Client _client = http.Client();

  Future<List<Story>> getStories({
    String? cycle,
    String? search,
    int limit = 50,
    int offset = 0,
  }) async {
    final params = <String, String>{
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    if (cycle != null) params['cycle'] = cycle;
    if (search != null && search.isNotEmpty) params['search'] = search;

    final uri = Uri.parse('${ApiConstants.baseUrl}/stories')
        .replace(queryParameters: params);

    final res = await _client.get(uri);
    if (res.statusCode != 200) throw Exception('Failed to load stories');

    final data = json.decode(res.body);
    return (data['stories'] as List).map((e) => Story.fromJson(e)).toList();
  }

  Future<Indicator> getIndicators() async {
    final res = await _client.get(
      Uri.parse('${ApiConstants.baseUrl}/indicators'),
    );
    if (res.statusCode != 200) throw Exception('Failed to load indicators');

    return Indicator.fromJson(json.decode(res.body));
  }

  Future<List<Source>> getSources() async {
    final res = await _client.get(
      Uri.parse('${ApiConstants.baseUrl}/sources'),
    );
    if (res.statusCode != 200) throw Exception('Failed to load sources');

    final data = json.decode(res.body);
    return (data['sources'] as List).map((e) => Source.fromJson(e)).toList();
  }

  Future<List<Region>> getRegions() async {
    final res = await _client.get(
      Uri.parse('${ApiConstants.baseUrl}/regions'),
    );
    if (res.statusCode != 200) throw Exception('Failed to load regions');

    final data = json.decode(res.body);
    return (data['regions'] as List).map((e) => Region.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getStoryDetail(String id) async {
    final res = await _client.get(
      Uri.parse('${ApiConstants.baseUrl}/story').replace(queryParameters: {'id': id}),
    );
    if (res.statusCode != 200) throw Exception('Failed to load story detail');
    return json.decode(res.body);
  }

  Future<List<dynamic>> getPredictions({String? cycle}) async {
    final params = <String, String>{};
    if (cycle != null) params['cycle'] = cycle;
    final uri = Uri.parse('${ApiConstants.baseUrl}/predictions').replace(queryParameters: params);
    final res = await _client.get(uri);
    if (res.statusCode != 200) throw Exception('Failed to load predictions');
    final data = json.decode(res.body);
    return data['predictions'] as List<dynamic>;
  }
}
