import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Service centralisé de Gestion des Paiements et Écoute des Webhooks Wave
class PaymentWebhookService {
  static const String _defaultBaseUrl = 'http://localhost:5500/api/v1';

  /// Initialise une session de paiement Wave via l'API Backend
  static Future<Map<String, dynamic>> initiateWavePayment({
    required String orderId,
    required double amount,
    String? customerPhone,
  }) async {
    try {
      final url = Uri.parse('$_defaultBaseUrl/payments/initiate');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'orderId': orderId,
          'amount': amount,
          'paymentMethod': 'wave',
          'customerPhone': customerPhone,
        }),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'checkoutUrl': data['data']['checkoutUrl'],
          'transactionId': data['data']['transactionId'],
        };
      }
    } catch (e) {
      debugPrint('[PaymentService] Mode local / fallback: $e');
    }

    // Fallback URL officielle marchande Wave pré-remplie
    return {
      'success': true,
      'checkoutUrl': 'https://pay.wave.com/m/M_ci_7X1JfUg2eEsX/c/ci/?src=p&amount=${amount.toInt()}&client_reference=$orderId',
      'transactionId': 'TX-LOCAL-${DateTime.now().millisecondsSinceEpoch}',
    };
  }

  /// Écoute en temps réel l'arrivée du Webhook de confirmation (Polling intelligent)
  static Stream<bool> listenForPaymentConfirmation({
    required String orderId,
    Duration interval = const Duration(seconds: 3),
    int maxAttempts = 40,
  }) async* {
    int attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      await Future.delayed(interval);

      try {
        final url = Uri.parse('$_defaultBaseUrl/payments/verify/$orderId');
        final response = await http.get(url).timeout(const Duration(seconds: 3));

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['isPaid'] == true) {
            yield true;
            return;
          }
        }
      } catch (_) {
        // En mode déconnecté ou test, continue le cycle
      }
    }
  }

  /// Simule l'envoi d'un Webhook Wave (pour tests et démonstrations en direct)
  static Future<bool> triggerWebhookSimulation({
    required String orderId,
    required double amount,
  }) async {
    try {
      final url = Uri.parse('$_defaultBaseUrl/payments/webhook');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'wave-signature': 'simulated_test_signature_2026',
        },
        body: jsonEncode({
          'type': 'checkout.session.completed',
          'client_reference': orderId,
          'amount': amount,
          'currency': 'XOF',
          'status': 'completed',
          'data': {
            'id': 'WAVE-SIM-${DateTime.now().millisecondsSinceEpoch}',
            'client_reference': orderId,
            'amount': amount,
          },
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[WebhookSimulation] Erreur: $e');
      return false;
    }
  }
}
