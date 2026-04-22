import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/constants.dart';

/// Handles subscription status and Stripe checkout session creation.
/// Endpoints: https://us-central1-prophet-auth.cloudfunctions.net/...
/// Placeholder URLs until Firebase functions are deployed.
class SubscriptionService {
  static const String _baseUrl = 'https://us-central1-prophet-auth.cloudfunctions.net';

  /// GET /api/subscription-status → {plan: 'free'|'pro', expiresAt}
  Future<Map<String, dynamic>> getStatus({String? uid}) async {
    try {
      final uri = Uri.parse('$_baseUrl/api/subscription-status');
      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (uid != null) 'Authorization': 'Bearer $uid',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    // Fallback: return free plan
    return {'plan': 'free', 'expiresAt': null};
  }

  /// POST /api/create-checkout-session → {url}
  Future<String> createCheckout({required String uid, bool annual = false}) async {
    try {
      final uri = Uri.parse('$_baseUrl/api/create-checkout-session');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'uid': uid,
          'priceId': annual ? 'price_annual' : 'price_monthly',
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final body = json.decode(response.body) as Map<String, dynamic>;
        return body['url'] as String? ?? '';
      }
    } catch (_) {}
    // Placeholder return for demo
    return 'https://checkout.stripe.com/placeholder';
  }
}