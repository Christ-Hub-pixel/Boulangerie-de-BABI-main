class OrderItemSnapshot {
  final String productName;
  final double unitPrice; // Prix unitaire figé au moment de l'achat
  final int quantity;

  const OrderItemSnapshot({
    required this.productName,
    required this.unitPrice,
    required this.quantity,
  });

  // Calcul automatique du sous-total : Prix unitaire × Quantité
  double get subtotal => unitPrice * quantity;

  Map<String, dynamic> toJson() {
    return {
      'productName': productName,
      'unitPrice': unitPrice,
      'quantity': quantity,
      'subtotal': subtotal,
    };
  }

  factory OrderItemSnapshot.fromJson(Map<String, dynamic> json) {
    return OrderItemSnapshot(
      productName: json['productName'] as String,
      unitPrice: (json['unitPrice'] as num).toDouble(),
      quantity: json['quantity'] as int,
    );
  }
}
