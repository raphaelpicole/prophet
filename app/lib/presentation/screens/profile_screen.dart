import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/subscription_service.dart';
import 'paywall_screen.dart';

/// Profile screen with two tabs: "Meu Plano" and "Histórico".
class ProfileScreen extends StatefulWidget {
  final AuthService authService;
  final VoidCallback onUpgrade;

  const ProfileScreen({
    super.key,
    required this.authService,
    required this.onUpgrade,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final SubscriptionService _subService = SubscriptionService();

  Map<String, dynamic>? _subscriptionStatus;
  bool _loadingStatus = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadSubscriptionStatus();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadSubscriptionStatus() async {
    final status = await _subService.getStatus(uid: widget.authService.uid);
    if (mounted) {
      setState(() {
        _subscriptionStatus = status;
        _loadingStatus = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPro = widget.authService.plan == 'pro';

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            TabBar(
              controller: _tabController,
              indicatorColor: AppTheme.primary,
              labelColor: AppTheme.primary,
              unselectedLabelColor: AppTheme.textoSec,
              tabs: const [
                Tab(text: '💳 Meu Plano', height: 40),
                Tab(text: '📜 Histórico', height: 40),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildPlanTab(isPro),
                  _buildHistoryTab(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildSignOutBar(),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.person, color: AppTheme.primary, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Meu Perfil', style: TextStyle(
                  color: AppTheme.texto, fontSize: 18, fontWeight: FontWeight.bold,
                )),
                const SizedBox(height: 2),
                Text(
                  widget.authService.uid ?? 'Usuário',
                  style: const TextStyle(color: AppTheme.textoSec, fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          _buildPlanBadge(),
        ],
      ),
    );
  }

  Widget _buildPlanBadge() {
    final isPro = widget.authService.plan == 'pro';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isPro
            ? AppTheme.prophet.withValues(alpha: 0.2)
            : AppTheme.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isPro ? AppTheme.prophet : AppTheme.surface,
        ),
      ),
      child: Text(
        isPro ? '⭐ Pro' : '🆓 Free',
        style: TextStyle(
          color: isPro ? AppTheme.prophet : AppTheme.textoSec,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildPlanTab(bool isPro) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Current plan card
          _planCard(isPro),
          const SizedBox(height: 16),

          // Usage stats
          _usageCard(isPro),
          const SizedBox(height: 16),

          // Upgrade CTA (if free)
          if (!isPro) _upgradeCTA(),
          if (isPro) _proRenewalCard(),

          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _planCard(bool isPro) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: isPro
            ? LinearGradient(
                colors: [
                  AppTheme.prophet.withValues(alpha: 0.3),
                  AppTheme.primary.withValues(alpha: 0.2),
                ],
              )
            : null,
        color: isPro ? null : AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPro ? AppTheme.prophet.withValues(alpha: 0.5) : AppTheme.surface,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isPro ? Icons.star : Icons.person_outline,
                color: isPro ? AppTheme.prophet : AppTheme.textoSec,
                size: 24,
              ),
              const SizedBox(width: 12),
              Text(
                isPro ? 'Prophet Pro' : 'Prophet Free',
                style: const TextStyle(
                  color: AppTheme.texto,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (isPro) ...[
            const Text(
              '✅ Acesso ilimitado ativo',
              style: TextStyle(color: AppTheme.sucesso, fontSize: 13),
            ),
            const SizedBox(height: 4),
            Text(
              'Renovação: ${_subscriptionStatus?['expiresAt'] ?? '—'}',
              style: const TextStyle(color: AppTheme.textoSec, fontSize: 12),
            ),
          ] else ...[
            const Text(
              '🆓 Plano gratuito — limite de uso',
              style: TextStyle(color: AppTheme.textoSec, fontSize: 13),
            ),
          ],
          const SizedBox(height: 16),
          if (!isPro)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: widget.onUpgrade,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text('Fazer Upgrade →', style: TextStyle(
                  fontWeight: FontWeight.w600,
                )),
              ),
            ),
        ],
      ),
    );
  }

  Widget _usageCard(bool isPro) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('📊 Uso atual', style: TextStyle(
            color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
          )),
          const SizedBox(height: 16),
          _usageRow(
            'Stories por dia',
            isPro ? '∞' : '8 / 10',
            isPro,
            8 / 10,
          ),
          const SizedBox(height: 12),
          _usageRow(
            'Previsões por semana',
            isPro ? '∞' : '2 / 3',
            isPro,
            2 / 3,
          ),
          const SizedBox(height: 12),
          _usageRow(
            'Histórico disponível',
            isPro ? '365 dias' : '7 dias',
            isPro,
            1.0,
          ),
        ],
      ),
    );
  }

  Widget _usageRow(String label, String value, bool isUnlimited, double fillRatio) {
    return Row(
      children: [
        Expanded(
          child: Text(label, style: const TextStyle(
            color: AppTheme.textoSec, fontSize: 13,
          )),
        ),
        Text(value, style: const TextStyle(
          color: AppTheme.texto, fontSize: 13, fontWeight: FontWeight.w600,
        )),
        if (!isUnlimited) ...[
          const SizedBox(width: 12),
          SizedBox(
            width: 60,
            child: LinearProgressIndicator(
              value: fillRatio,
              backgroundColor: AppTheme.surface,
              color: fillRatio >= 0.9 ? AppTheme.alerta : AppTheme.primary,
              borderRadius: BorderRadius.circular(3),
              minHeight: 4,
            ),
          ),
        ],
      ],
    );
  }

  Widget _upgradeCTA() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primary.withValues(alpha: 0.2),
            AppTheme.prophet.withValues(alpha: 0.15),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [
            Text('🚀 Desbloqueie tudo', style: TextStyle(
              color: AppTheme.texto, fontSize: 16, fontWeight: FontWeight.bold,
            )),
          ]),
          const SizedBox(height: 8),
          const Text(
            'Stories ilimitadas, previsões sem limites e 1 ano de histórico.',
            style: TextStyle(color: AppTheme.textoSec, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('R\$ 27/mês', style: TextStyle(
                      color: AppTheme.texto, fontSize: 20, fontWeight: FontWeight.bold,
                    )),
                    const Text('ou R\$197/ano (15% off)', style: TextStyle(
                      color: AppTheme.sucesso, fontSize: 11,
                    )),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: widget.onUpgrade,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text('Upgrade', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _proRenewalCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🗓️ Informações da assinatura', style: TextStyle(
            color: AppTheme.texto, fontSize: 14, fontWeight: FontWeight.w600,
          )),
          const SizedBox(height: 12),
          _infoRow('Plano', 'Prophet Pro'),
          _infoRow('Valor', 'R\$ 27/mês'),
          _infoRow('Próxima renovação', _subscriptionStatus?['expiresAt'] ?? '—'),
          _infoRow('Status', 'Ativo ✅'),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () {},
            child: const Text('Gerenciar assinatura', style: TextStyle(
              color: AppTheme.primary, fontSize: 13,
            )),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text('$label:', style: const TextStyle(color: AppTheme.textoSec, fontSize: 13)),
          const SizedBox(width: 8),
          Text(value, style: const TextStyle(color: AppTheme.texto, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildHistoryTab() {
    // Placeholder history — could connect to Firestore later
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Icon(Icons.history, color: AppTheme.textoSec, size: 48),
              const SizedBox(height: 12),
              const Text('Histórico de uso', style: TextStyle(
                color: AppTheme.texto, fontSize: 15, fontWeight: FontWeight.w600,
              )),
              const SizedBox(height: 8),
              const Text(
                'Suas atividades aparecerão aqui conforme usar o app.',
                style: TextStyle(color: AppTheme.textoSec, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: widget.onUpgrade,
                child: const Text('Ver histórico completo com Pro →', style: TextStyle(
                  color: AppTheme.primary, fontSize: 13,
                )),
              ),
            ],
          ),
        ),
        const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildSignOutBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(top: BorderSide(color: AppTheme.card, width: 1)),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () async {
              await widget.authService.signOut();
              if (context.mounted) {
                Navigator.of(context).popUntil((route) => route.isFirst);
              }
            },
            icon: const Icon(Icons.logout, size: 18),
            label: const Text('Sair'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.textoSec,
              side: const BorderSide(color: AppTheme.surface),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
      ),
    );
  }
}