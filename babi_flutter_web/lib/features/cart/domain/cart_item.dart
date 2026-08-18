import 'package:flutter/material.dart';

class CartItem {
  final String id;
  final String name;
  final double price;
  final IconData icon;
  final int quantity;

  CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.icon,
    this.quantity = 1,
  });

  CartItem copyWith({
    String? id,
    String? name,
    double? price,
    IconData? icon,
    int? quantity,
  }) {
    return CartItem(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      icon: icon ?? this.icon,
      quantity: quantity ?? this.quantity,
    );
  }
}
