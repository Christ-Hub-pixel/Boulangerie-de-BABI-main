import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/dummy_products.dart';

final productsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  // Fournit la liste complète des produits enregistrés de la boulangerie
  return ProductData.products;
});
