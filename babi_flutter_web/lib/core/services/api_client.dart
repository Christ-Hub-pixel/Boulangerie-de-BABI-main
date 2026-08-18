import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  // URL de base de l'API Gateway (Port 5500)
  String baseUrl = 'http://localhost:5500/api/v1';

  // Token JWT en session
  String? authToken;
  Map<String, dynamic>? currentUser;

  void setAuthToken(String token) {
    authToken = token;
  }

  void clearSession() {
    authToken = null;
    currentUser = null;
  }

  Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (authToken != null) 'Authorization': 'Bearer $authToken',
    };
  }

  // --- 1. AUTHENTIFICATION ---
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: _getHeaders(),
        body: jsonEncode({
          'identifier': identifier,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        authToken = data['data']['token'];
        currentUser = data['data']['user'];
        return data;
      } else {
        throw Exception(data['message'] ?? 'Erreur lors de la connexion');
      }
    } catch (e) {
      debugPrint('ApiClient.login erreur: $e');
      rethrow;
    }
  }

  // --- 2. CATALOGUE PRODUITS ---
  Future<List<dynamic>> getProducts({String? category, String? search}) async {
    try {
      final queryParams = <String, String>{};
      if (category != null && category != 'Tous') queryParams['category'] = category;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final uri = Uri.parse('$baseUrl/products').replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      final response = await http.get(uri, headers: _getHeaders()).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      debugPrint('ApiClient.getProducts exception: $e');
      return [];
    }
  }

  // --- 3. COMMANDES CLICK & COLLECT ---
  Future<Map<String, dynamic>> createOrder({
    required List<Map<String, dynamic>> items,
    String paymentMethod = 'wave',
    String? promoCode,
    String? notes,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: _getHeaders(),
        body: jsonEncode({
          'items': items,
          'paymentMethod': paymentMethod,
          'promoCode': promoCode,
          'notes': notes,
        }),
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 201 && data['success'] == true) {
        return data['data'];
      } else {
        throw Exception(data['message'] ?? 'Erreur création commande');
      }
    } catch (e) {
      debugPrint('ApiClient.createOrder exception: $e');
      rethrow;
    }
  }

  // --- 4. VALIDATION PIN (CAISSIÈRE) ---
  Future<Map<String, dynamic>> verifyPickupPin(String pin, {double? billGiven}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders/verify-pin'),
        headers: _getHeaders(),
        body: jsonEncode({
          'pin': pin,
          'billGiven': billGiven,
        }),
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data['data'];
      } else {
        throw Exception(data['message'] ?? 'Code PIN invalide');
      }
    } catch (e) {
      debugPrint('ApiClient.verifyPickupPin exception: $e');
      rethrow;
    }
  }

  // --- 5. GESTION DU STATUT (GÉRANTE / CUISINE) ---
  Future<Map<String, dynamic>> updateOrderStatus(String orderId, String status) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/orders/$orderId/status'),
        headers: _getHeaders(),
        body: jsonEncode({'status': status}),
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data['data'];
      } else {
        throw Exception(data['message'] ?? 'Erreur mise à jour statut');
      }
    } catch (e) {
      debugPrint('ApiClient.updateOrderStatus exception: $e');
      rethrow;
    }
  }

  // --- 6. GESTION DES STOCKS ---
  Future<List<dynamic>> getStocks() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/stocks'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      debugPrint('ApiClient.getStocks exception: $e');
      return [];
    }
  }

  Future<bool> recordStockMovement({
    required String productId,
    required String movementType,
    required int quantityChanged,
    String? notes,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/stocks/movement'),
        headers: _getHeaders(),
        body: jsonEncode({
          'productId': productId,
          'movementType': movementType,
          'quantityChanged': quantityChanged,
          'notes': notes,
        }),
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      return (response.statusCode == 200 && data['success'] == true);
    } catch (e) {
      debugPrint('ApiClient.recordStockMovement exception: $e');
      return false;
    }
  }

  // --- 7. RAPPORTS ANALYTIQUES (ADMIN / GÉRANTE) ---
  Future<Map<String, dynamic>?> getSummaryReport() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/reports/summary'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      debugPrint('ApiClient.getSummaryReport exception: $e');
      return null;
    }
  }
}
