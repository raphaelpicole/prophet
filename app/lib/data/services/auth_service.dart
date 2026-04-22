import 'package:shared_preferences/shared_preferences.dart';

/// Mock auth service using anonymous sign-in.
/// Real Firebase Auth will be wired up later.
/// Uses SharedPreferences to persist UID.
class AuthService {
  static const _uidKey = 'prophet_uid';
  static const _planKey = 'prophet_plan';

  String? _uid;
  String _plan = 'free';

  String? get uid => _uid;
  String get plan => _plan;
  bool get isLoggedIn => _uid != null;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _uid = prefs.getString(_uidKey);
    _plan = prefs.getString(_planKey) ?? 'free';
  }

  Future<bool> signIn() async {
    // Mock anonymous sign-in — generates a random UID
    final uid = 'anon_${DateTime.now().millisecondsSinceEpoch}';
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_uidKey, uid);
    await prefs.setString(_planKey, 'free');
    _uid = uid;
    _plan = 'free';
    return true;
  }

  Future<bool> signInWithGoogle() async {
    // Placeholder: real Google Sign-In via Firebase Auth
    // For now, simulate a pro user for demo purposes
    final prefs = await SharedPreferences.getInstance();
    final uid = 'google_${DateTime.now().millisecondsSinceEpoch}';
    await prefs.setString(_uidKey, uid);
    await prefs.setString(_planKey, 'pro');
    _uid = uid;
    _plan = 'pro';
    return true;
  }

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_uidKey);
    await prefs.remove(_planKey);
    _uid = null;
    _plan = 'free';
  }

  Future<String?> getIdToken() async {
    // Placeholder for Firebase ID token
    return _uid;
  }

  void upgradeToPro() async {
    _plan = 'pro';
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_planKey, 'pro');
  }
}