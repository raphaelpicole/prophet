import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/auth_service.dart';

/// Simple login screen shown before app access.
/// - "Enter to continue" + Google Sign-In button
/// - "Continue as anonymous" (free forever)
typedef OnLoginSuccess = void Function(AuthService auth);

class LoginScreen extends StatefulWidget {
  final AuthService authService;
  final OnLoginSuccess onLoginSuccess;

  const LoginScreen({
    super.key,
    required this.authService,
    required this.onLoginSuccess,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _loading = false;
  String? _error;

  Future<void> _signInAnonymous() async {
    setState(() { _loading = true; _error = null; });
    try {
      await widget.authService.signIn();
      widget.onLoginSuccess(widget.authService);
    } catch (e) {
      setState(() { _loading = false; _error = 'Erro ao entrar: $e'; });
    }
  }

  Future<void> _signInWithGoogle() async {
    setState(() { _loading = true; _error = null; });
    try {
      await widget.authService.signInWithGoogle();
      widget.onLoginSuccess(widget.authService);
    } catch (e) {
      setState(() { _loading = false; _error = 'Erro com Google: $e'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              // Logo / Icon
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.visibility,
                  color: AppTheme.primary,
                  size: 56,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Prophet',
                style: TextStyle(
                  color: AppTheme.texto,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Inteligência de sinais globais',
                style: TextStyle(color: AppTheme.textoSec, fontSize: 15),
              ),
              const Spacer(),

              // Error message
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.alerta.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: AppTheme.alerta, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Google sign-in button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : _signInWithGoogle,
                  icon: _loading
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2,
                          ),
                        )
                      : const Text('🔵', style: TextStyle(fontSize: 18)),
                  label: Text(
                    _loading ? 'Entrando...' : 'Entre com Google',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.card,
                    foregroundColor: AppTheme.texto,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: AppTheme.surface),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Anonymous continue
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: _loading ? null : _signInAnonymous,
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.textoSec,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text(
                    'Continuar como anônimo (grátis para sempre)',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }
}