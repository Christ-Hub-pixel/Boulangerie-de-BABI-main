import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/cart_item.dart';

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void addItem(CartItem item) {
    // Vérifier si l'article est déjà dans le panier
    final existingIndex = state.indexWhere((element) => element.id == item.id);
    
    if (existingIndex >= 0) {
      // Augmenter la quantité
      final existingItem = state[existingIndex];
      final updatedItem = existingItem.copyWith(quantity: existingItem.quantity + 1);
      state = [
        for (int i = 0; i < state.length; i++)
          if (i == existingIndex) updatedItem else state[i]
      ];
    } else {
      // Ajouter le nouvel article
      state = [...state, item];
    }
  }

  void removeItem(String id) {
    state = state.where((item) => item.id != id).toList();
  }

  void increaseQuantity(String id) {
    state = state.map((item) {
      if (item.id == id) {
        return item.copyWith(quantity: item.quantity + 1);
      }
      return item;
    }).toList();
  }

  void decreaseQuantity(String id) {
    state = state.map((item) {
      if (item.id == id && item.quantity > 1) {
        return item.copyWith(quantity: item.quantity - 1);
      }
      return item;
    }).toList();
  }

  void clearCart() {
    state = [];
  }

  double get totalPrice {
    return state.fold(0, (total, item) => total + (item.price * item.quantity));
  }

  int get totalItems {
    return state.fold(0, (total, item) => total + item.quantity);
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});
