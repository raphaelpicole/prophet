import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/subscription_service.dart';

/// Full-screen paywall/monetization screen.
/// Shown as modal from ProBanner or other upgrade triggers.
class PaywallScreen extends StatelessWidget {
  const PaywallScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 32),
              _buildHero(),
              const SizedBox(height: 32),
              _buildPricing(),
              const SizedBox(height: 24),
              _buildFeatureComparison(),
              const SizedBox(height: 32),
              _buildCTAS(),
              const SizedBox(height: 16),
              _buildDismissButton(context),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.primary.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.lock_open, color: AppTheme.primary, size: 48),
        ),
        const SizedBox(height: 20),
        const Text(
          '🔓 Desbloqueie o Prophet Pro',
          style: TextStyle(
            color: AppTheme.texto,
            fontSize: 26,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        const Text(
          'Acesso ilimitado a todas as funcionalidades.\nSem limites, sem comprometimentos.',
          style: TextStyle(color: AppTheme.textoSec, fontSize: 15),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildPricing() {
    return Row(
      children: [
        Expanded(child: _priceCard('R\$ 27', '/mês', false)),
        const SizedBox(width: 12),
        Expanded(child: _priceCard('R\$ 197', '/ano', true)),
      ],
    );
  }

  Widget _priceCard(String price, String period, bool isAnnual) {
    final discount = isAnnual;
    return GestureDetector(
      onTap: () => _handleCheckout(price.contains('27') ? false : true),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isAnnual ? AppTheme.primary : AppTheme.surface,
            width: isAnnual ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            if (isAnnual) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.sucesso.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  '15% off',
                  style: TextStyle(color: AppTheme.sucesso, fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 8),
            ],
            Text(
              price,
              style: const TextStyle(
                color: AppTheme.texto,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              period,
              style: const TextStyle(color: AppTheme.textoSec, fontSize: 13),
            ),
            if (isAnnual) ...[
              const SizedBox(height: 4),
              const Text(
                'equivale a R\$16/mês',
                style: TextStyle(color: AppTheme.sucesso, fontSize: 11),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureComparison() {
    final free = ['10 stories/dia', '3 previsões/semana', '7 dias de histórico'];
    final pro = ['∞ stories/dia', '∞ previsões/semana', '365 dias de histórico', '🔔 Alertas em tempo real', '📊 Fontes ilimitadas'];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('✨ O que você ganha:', style: TextStyle(
            color: AppTheme.texto, fontSize: 16, fontWeight: FontWeight.w600,
          )),
          const SizedBox(height: 16),
          ...pro.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              const Icon(Icons.check_circle, color: AppTheme.sucesso, size: 18),
              const SizedBox(width: 10),
              Text(f, style: const TextStyle(color: AppTheme.texto, fontSize: 14)),
            ]),
          )),
          const SizedBox(height: 8),
          const Divider(color: AppTheme.surface),
          const SizedBox(height: 8),
          const Text('🆓 Free:', style: TextStyle(color: AppTheme.textoSec, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          ...free.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(children: [
              const Icon(Icons.remove_circle_outline, color: AppTheme.textoSec, size: 16),
              const SizedBox(width: 10),
              Text(f, style: const TextStyle(color: AppTheme.textoSec, fontSize: 13)),
            ]),
          )),
        ],
      ),
    );
  }

  Widget _buildCTAS() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => _handleCheckout(false),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Assinar Pro', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: TextButton(
            onPressed: () => _handleCheckout(true),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.textoSec,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            child: const Text('Pagar anualmente (15% off)', style: TextStyle(fontSize: 13)),
          ),
        ),
      ],
    );
  }

  Widget _buildDismissButton(BuildContext context) {
    return TextButton(
      onPressed: () => Navigator.of(context).pop(),
      child: const Text(
        'Continuar como Free',
        style: TextStyle(color: AppTheme.textoSec, fontSize: 13),
      ),
    );
  }

  Future<void> _handleCheckout(bool annual) async {
    // In production, call SubscriptionService.createCheckout(annual: annual)
    // and redirect to the returned Stripe URL.
    // For now, show a placeholder snackbar.
    final url = annual
        ? 'https://checkout.stripe.com/placeholder?plan=annual'
        : 'https://checkout.stripe.com/placeholder?plan=monthly';
    try {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } catch (_) {}
  }
}