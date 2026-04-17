import '../models/story.dart';
import '../models/indicator.dart';

/// Mock data para desenvolvimento offline
class MockService {
  static List<Story> getStories() {
    return [
      Story(
        id: '1',
        title: 'Operação Narco Fluxo',
        summary: 'PF prende funkeiros em esquema de lavagem de R\$ 1,6 bi',
        mainSubject: 'Operação PF contra funk',
        cycle: 'conflito',
        sentimentTrend: 'falling',
        hotness: 85,
        articleCount: 14,
        updatedAt: DateTime.now().subtract(const Duration(hours: 6)),
      ),
      Story(
        id: '2',
        title: 'Escala 6×1 — Greve deProfessores',
        summary: 'Professores de SP ameaçam grevee reivindicam PLR',
        mainSubject: 'Greve professores SP',
        cycle: 'social',
        sentimentTrend: 'rising',
        hotness: 72,
        articleCount: 23,
        updatedAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      Story(
        id: '3',
        title: 'FMI libera US\$ 1 bi para Argentina',
        summary: 'Fundo Monetário aprova liberação de parcela após acordo fiscal',
        mainSubject: 'Crise Argentina',
        cycle: 'economico',
        sentimentTrend: 'stable',
        hotness: 65,
        articleCount: 8,
        updatedAt: DateTime.now().subtract(const Duration(hours: 12)),
      ),
      Story(
        id: '4',
        title: 'Conflito armado no Oriente Médio',
        summary: 'Mobilização militar na fronteira após incidente diplomático',
        mainSubject: 'Oriente Médio',
        cycle: 'conflito',
        sentimentTrend: 'rising',
        hotness: 91,
        articleCount: 31,
        updatedAt: DateTime.now().subtract(const Duration(hours: 1)),
      ),
    ];
  }

  static Indicator getIndicator() {
    return Indicator(
      totalStories: 47,
      articlesToday: 128,
      cycles: {
        'conflito': 12,
        'economico': 15,
        'politico': 10,
        'social': 6,
        'tecnologico': 3,
        'ambiental': 1,
      },
      hotStories: [
        HotStory(id: '4', title: 'Conflito armado no Oriente Médio', articleCount: 31, avgSentiment: -0.6),
        HotStory(id: '1', title: 'Operação Narco Fluxo', articleCount: 14, avgSentiment: -0.3),
        HotStory(id: '2', title: 'Escala 6×1 — Greve de Professores', articleCount: 23, avgSentiment: -0.1),
      ],
      updatedAt: DateTime.now(),
    );
  }
}
