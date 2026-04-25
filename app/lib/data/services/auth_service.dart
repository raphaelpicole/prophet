import 'package:shared_preferences/shared_preferences.dart';

/// Auth service usando shared_preferences (compatível com Flutter Web/WASM).
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
      final prefs = await SharedPreferences.getInstance();
      _uid = prefs.getString(_uidKey);
      _plan = prefs.getString(_planKey) ?? 'free';
      _email = prefs.getString(_emailKey);
      _name = prefs.getString(_nameKey);
    } catch (e) {
      _uid = null;
      _plan = 'free';
      _email = null;
      _name = null;
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
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_uidKey, uid);
      await prefs.setString(_planKey, 'free');
      await prefs.setString(_emailKey, email);
    } catch (_) {}
    _uid = uid;
    _email = email;
    _plan = 'free';
  }

  /// Login com email/senha (simulado)
  Future<void> signInWithEmail(String email, String password) async {
    final uid = 'email_${DateTime.now().millisecondsSinceEpoch}';
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_uidKey, uid);
      await prefs.setString(_planKey, 'free');
      await prefs.setString(_emailKey, email);
    } catch (_) {}
    _uid = uid;
    _email = email;
    _plan = 'free';
  }

  /// Login anônimo
  Future<bool> signIn() async {
    final uid = 'anon_${DateTime.now().millisecondsSinceEpoch}';
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_uidKey, uid);
      await prefs.setString(_planKey, 'free');
    } catch (_) {}
    _uid = uid;
    _plan = 'free';
    return true;
  }

  /// Login com Google (simulado)
  Future<bool> signInWithGoogle() async {
    final uid = 'google_${DateTime.now().millisecondsSinceEpoch}';
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_uidKey, uid);
      await prefs.setString(_planKey, 'pro');
    } catch (_) {}
    _uid = uid;
    _plan = 'pro';
    return true;
  }

  /// Sair
  Future<void> signOut() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_uidKey);
      await prefs.remove(_planKey);
      await prefs.remove(_emailKey);
      await prefs.remove(_nameKey);
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
  Future<void> upgradeToPro() async {
    _plan = 'pro';
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_planKey, 'pro');
    } catch (_) {}
  }
}