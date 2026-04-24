import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// Auth service usando Firebase Auth (email/senha + Google OAuth).
/// Fallback para localStorage em caso de indisponibilidade.
class AuthService {
  static const _planKey = 'prophet_plan';

  final FirebaseAuth _auth = FirebaseAuth.instance;

  String _plan = 'free';

  String? get uid => _auth.currentUser?.uid;
  String get plan => _plan;
  bool get isLoggedIn => _auth.currentUser != null;
  User? get currentUser => _auth.currentUser;

  Future<void> init() async {
    try {
      // localStorage só disponível na web; kIsWeb protege
      if (kIsWeb) {
        // Não podemos acessar dart:html diretamente se quisermos compilar
        // para mobile, então mantemos o plan como free por padrão.
        // O plan real pode vir de Firestore futuramente.
        _plan = 'free';
      }
    } catch (e) {
      _plan = 'free';
    }
  }

  /// Stream de mudanças de estado de autenticação
  Stream<User?> get onAuthStateChanged => _auth.authStateChanges();

  /// Cadastro com email/senha
  Future<UserCredential> signUpWithEmail(String email, String password) async {
    final credential = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    return credential;
  }

  /// Login com email/senha
  Future<UserCredential> signInWithEmail(String email, String password) async {
    final credential = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    return credential;
  }

  /// Login com Google (web usa popup)
  Future<UserCredential> signInWithGoogle() async {
    final googleProvider = GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.setCustomParameters({'prompt': 'select_account'});

    if (kIsWeb) {
      return await _auth.signInWithPopup(googleProvider);
    } else {
      // Mobile fallback – requer google_sign_in package
      // Para web não precisamos disso, mas mantém compatibilidade
      throw UnsupportedError('Google Sign-In mobile não configurado. Use web.');
    }
  }

  /// Sair
  Future<void> signOut() async {
    await _auth.signOut();
    _plan = 'free';
  }

  /// Recuperação de senha
  Future<void> resetPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email);
  }

  /// Atualizar senha do usuário logado
  Future<void> updatePassword(String newPassword) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Nenhum usuário logado');
    await user.updatePassword(newPassword);
  }

  /// Retorna usuário atual
  User? getCurrentUser() => _auth.currentUser;

  /// Token ID do Firebase
  Future<String?> getIdToken() async {
    return await _auth.currentUser?.getIdToken();
  }

  /// Marca plano como Pro (local)
  void upgradeToPro() {
    _plan = 'pro';
  }
}
