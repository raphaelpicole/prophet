import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/auth_service.dart';

class SignUpScreen extends StatefulWidget {
  final AuthService authService;
  final void Function(AuthService auth) onLoginSuccess;

  const SignUpScreen({
    super.key,
    required this.authService,
    required this.onLoginSuccess,
  });

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _error;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _signUp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final credential = await widget.authService.signUpWithEmail(
        _emailCtrl.text.trim(),
        _passwordCtrl.text.trim(),
      );

      // Atualizar displayName se o usuário informou nome
      final name = _nameCtrl.text.trim();
      if (name.isNotEmpty && credential.user != null) {
        await credential.user!.updateDisplayName(name);
      }

      widget.onLoginSuccess(widget.authService);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = _parseAuthError(e);
      });
    }
  }

  String _parseAuthError(dynamic error) {
    final msg = error.toString().toLowerCase();
    if (msg.contains('email-already-in-use')) return 'Este email já está em uso.';
    if (msg.contains('invalid-email')) return 'Email inválido.';
    if (msg.contains('weak-password')) return 'Senha muito fraca. Use pelo menos 6 caracteres.';
    if (msg.contains('network-request-failed')) return 'Sem conexão com a internet.';
    return 'Erro ao criar conta: $error';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: BackButton(color: AppTheme.textoSec),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Criar conta',
                  style: TextStyle(
                    color: AppTheme.texto,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Preencha os dados para se cadastrar',
                  style: TextStyle(color: AppTheme.textoSec, fontSize: 14),
                ),
                const SizedBox(height: 32),

                if (_error != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.alerta.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _error!,
                      style: const TextStyle(
                        color: AppTheme.alerta,
                        fontSize: 13,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Nome (opcional)
                TextFormField(
                  controller: _nameCtrl,
                  style: const TextStyle(color: AppTheme.texto),
                  decoration: InputDecoration(
                    hintText: 'Nome (opcional)',
                    hintStyle: const TextStyle(color: AppTheme.textoSec),
                    prefixIcon:
                        const Icon(Icons.person_outline, color: AppTheme.textoSec),
                    filled: true,
                    fillColor: AppTheme.card,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Email
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: AppTheme.texto),
                  decoration: InputDecoration(
                    hintText: 'Email',
                    hintStyle: const TextStyle(color: AppTheme.textoSec),
                    prefixIcon:
                        const Icon(Icons.email_outlined, color: AppTheme.textoSec),
                    filled: true,
                    fillColor: AppTheme.card,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Informe o email';
                    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+').hasMatch(v)) {
                      return 'Email inválido';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: AppTheme.texto),
                  decoration: InputDecoration(
                    hintText: 'Senha',
                    hintStyle: const TextStyle(color: AppTheme.textoSec),
                    prefixIcon:
                        const Icon(Icons.lock_outline, color: AppTheme.textoSec),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: AppTheme.textoSec,
                      ),
                      onPressed: () => setState(
                        () => _obscurePassword = !_obscurePassword,
                      ),
                    ),
                    filled: true,
                    fillColor: AppTheme.card,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Informe a senha';
                    if (v.length < 6) return 'Mínimo 6 caracteres';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Confirm password
                TextFormField(
                  controller: _confirmCtrl,
                  obscureText: _obscureConfirm,
                  style: const TextStyle(color: AppTheme.texto),
                  decoration: InputDecoration(
                    hintText: 'Confirmar senha',
                    hintStyle: const TextStyle(color: AppTheme.textoSec),
                    prefixIcon:
                        const Icon(Icons.lock_outline, color: AppTheme.textoSec),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: AppTheme.textoSec,
                      ),
                      onPressed: () => setState(
                        () => _obscureConfirm = !_obscureConfirm,
                      ),
                    ),
                    filled: true,
                    fillColor: AppTheme.card,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Confirme a senha';
                    if (v != _passwordCtrl.text) return 'As senhas não coincidem';
                    return null;
                  },
                ),
                const SizedBox(height: 32),

                // Criar conta
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _signUp,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'Criar conta',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),

                // Já tem conta
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Já tem conta? ',
                      style: TextStyle(color: AppTheme.textoSec),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: const Text(
                        'Entrar',
                        style: TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
