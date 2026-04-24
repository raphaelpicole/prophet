import 'dart:html' if (dart.library.io) 'dart:io';

/// Auth service usando localStorage para web (não depende de shared_preferences)
/// Firebase Auth desativado temporariamente devido a problemas de compatibilidade web.
class AuthService {
  static const _uidKey = 'prophet_uid';
  static const _planKey = 'prophet_plan';
  static const _emailKey = 'prophet_email';
  static const _nameKey = 'prophet_name';

  String? _uid;
  String _plan = 'free';
  String? _email;
  String? _name;

  String? get uid => _uid;
  String get plan => _plan;
  bool get isLoggedIn => _uid != null;
  String? get email => _email;
  String? get displayName => _name;
  String? get photoURL => null; // Não suportado no localStorage

  Future<void> init() async {
    try {
      _uid = window.localStorage[_uidKey];
      _plan = window.localStorage[_planKey] ?? 'free';
      _email = window.localStorage[_emailKey];
      _name = window.localStorage[_nameKey];
    } catch (e) {
      _uid = null;
      _plan = 'free';
    }
  }

  // Stream para compatibilidade com código que espera Firebase Auth
  Stream<String?> get onAuthStateChanged async* {
    yield _uid;
  }

  /// Cadastro com email/senha (simulado)
  Future<void> signUpWithEmail(String email, String password) async {
    final uid = 'email_${DateTime.now().millisecondsSinceEpoch}';
    try {
      window.localStorage[_uidKey] = uid;
      window.localStorage[_planKey] = 'free';
      window.localStorage[_emailKey] = email;
    } catch (_) {}
    _uid = uid;
    _email = email;
    _plan = 'free';
  }

  /// Login com email/senha (simulado)
  Future<void> signInWithEmail(String email, String password) async {
    final uid = 'email_${DateTime.now().millisecondsSinceEpoch}';
    try {
      window.localStorage[_uidKey] = uid;
      window.localStorage[_planKey] = 'free';
      window.localStorage[_emailKey] = email;
    } catch (_) {}
    _uid = uid;
    _email = email;
    _plan = 'free';
  }

  /// Login anônimo
  Future<bool> signIn() async {
    final uid = 'anon_${DateTime.now().millisecondsSinceEpoch}';
    try {
      window.localStorage[_uidKey] = uid;
      window.localStorage[_planKey] = 'free';
    } catch (_) {}
    _uid = uid;
    _plan = 'free';
    return true;
  }

  /// Login com Google (simulado)
  Future<bool> signInWithGoogle() async {
    final uid = 'google_${DateTime.now().millisecondsSinceEpoch}';
    try {
      window.localStorage[_uidKey] = uid;
      window.localStorage[_planKey] = 'pro';
    } catch (_) {}
    _uid = uid;
    _plan = 'pro';
    return true;
  }

  /// Sair
  Future<void> signOut() async {
    try {
      window.localStorage.remove(_uidKey);
      window.localStorage.remove(_planKey);
      window.localStorage.remove(_emailKey);
      window.localStorage.remove(_nameKey);
    } catch (_) {}
    _uid = null;
    _email = null;
    _name = null;
    _plan = 'free';
  }

  /// Recuperação de senha (simulado)
  Future<void> resetPassword(String email) async {
    // Simulação: não faz nada no localStorage
    await Future.delayed(const Duration(seconds: 1));
  }

  /// Atualizar senha (simulado)
  Future<void> updatePassword(String newPassword) async {
    // Simulação: não faz nada no localStorage
  }

  /// Retorna usuário atual
  String? getCurrentUser() => _uid;

  /// Token ID (simulado)
  Future<String?> getIdToken() async {
    return _uid;
  }

  /// Marca plano como Pro
  void upgradeToPro() async {
    _plan = 'pro';
    try {
      window.localStorage[_planKey] = 'pro';
    } catch (_) {}
  }
}