import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/mock_service.dart';
import '../widgets/kpi_card.dart';
import '../widgets/story_card.dart';
import '../widgets/cycle_donut.dart';

class RadarScreen extends StatelessWidget {
  const RadarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final indicator = MockService.getIndicator();
    final stories = MockService.getStories();

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // AppBar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.visibility, color: AppTheme.primary, size: 24),
                    const SizedBox(width: 8),
                    const Text(
                      '🔮 Prophet',
                      style: TextStyle(
                        color: AppTheme.texto,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.notifications_outlined, color: AppTheme.textoSec),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: const Icon(Icons.person_outline, color: AppTheme.textoSec),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ),

            // KPI Cards
            SliverToBoxAdapter(
              child: SizedBox(
                height: 110,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    KpiCard(
                      label: 'artigos /dia',
                      value: '${indicator.articlesToday}',
                      icon: Icons.article_outlined,
                      color: Colors.blue,
                    ),
                    const SizedBox(width: 10),
                    KpiCard(
                      label: 'stories',
                      value: '${indicator.totalStories}',
                      icon: Icons.local_fire_department,
                      color: Colors.orange,
                    ),
                    const SizedBox(width: 10),
                    KpiCard(
                      label: 'previsões',
                      value: '5',
                      icon: Icons.auto_awesome,
                      color: AppTheme.prophet,
                    ),
                    const SizedBox(width: 10),
                    KpiCard(
                      label: 'alertas',
                      value: '2',
                      icon: Icons.warning_amber,
                      color: AppTheme.alerta,
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // Histórias Quentes
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Icon(Icons.local_fire_department, color: Colors.orange, size: 16),
                    const SizedBox(width: 6),
                    const Text(
                      '🔥 Histórias Quentes',
                      style: TextStyle(
                        color: AppTheme.texto,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 10)),

            // Story list
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final story = stories[index];
                    return StoryCard(
                      story: story,
                      onTap: () {
                        Navigator.pushNamed(context, '/story', arguments: story);
                      },
                    );
                  },
                  childCount: stories.length,
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // Ciclo Dominante
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.card,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: CycleDonut(cycles: indicator.cycles),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}
