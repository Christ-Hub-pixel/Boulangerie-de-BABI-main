import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final List<Map<String, dynamic>> _items = [
    {
      'id': '1',
      'name': 'Baguette Tradition 150',
      'category': 'Pains',
      'price': 150.0,
      'quantity': 2,
      'image': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    },
    {
      'id': '4',
      'name': 'Croissant Pur Beurre',
      'category': 'Viennoiseries',
      'price': 500.0,
      'quantity': 1,
      'image': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    },
  ];

  String _deliveryMode = 'Livraison';
  final TextEditingController _couponController = TextEditingController();

  double get subtotal => _items.fold(0, (sum, item) => sum + (item['price'] * item['quantity']));
  double get deliveryFee => _deliveryMode == 'Livraison' ? 500.0 : 0.0;
  double get total => subtotal + deliveryFee;

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  void _onCheckout() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const CheckoutScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF4B400);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1F1F1F), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Mon Panier',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: () => setState(() => _items.clear()),
          ),
          IconButton(
            icon: const Icon(Icons.favorite_border, color: Color(0xFF1F1F1F)),
            onPressed: () {},
          ),
        ],
      ),
      body: _items.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.shopping_cart_outlined, size: 100, color: Color(0xFFD1D5DB)),
                    const SizedBox(height: 20),
                    Text(
                      'Votre panier est vide',
                      style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F)),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Ajoutez de délicieux produits pour commencer votre commande.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF6B7280)),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text('Découvrir nos produits', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Mode de réception toggle
                  Container(
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.all(4),
                    child: Row(
                      children: ['Livraison', 'Retrait en boutique'].map((mode) {
                        final isSelected = _deliveryMode == mode;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _deliveryMode = mode),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? primaryColor : Colors.transparent,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Text(
                                mode,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? Colors.white : const Color(0xFF1F1F1F),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Cart Items List
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _items.length,
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                item['image'],
                                width: 70,
                                height: 70,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => Container(
                                  width: 70,
                                  height: 70,
                                  color: const Color(0xFFFFF3D6),
                                  child: const Icon(Icons.bakery_dining_rounded, color: primaryColor),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item['name'], style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                                  Text(item['category'], style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text('${item['price'].toInt()} FCFA', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: primaryColor)),
                                ],
                              ),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline, size: 20),
                                  onPressed: () {
                                    setState(() {
                                      if (item['quantity'] > 1) {
                                        item['quantity']--;
                                      } else {
                                        _items.removeAt(index);
                                      }
                                    });
                                  },
                                ),
                                Text('${item['quantity']}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                                IconButton(
                                  icon: const Icon(Icons.add_circle_outline, size: 20),
                                  onPressed: () => setState(() => item['quantity']++),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  // Coupon Code
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: Row(
                      children: [
                        const Icon(Icons.local_offer_outlined, color: primaryColor),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _couponController,
                            decoration: InputDecoration(
                              hintText: 'Code promo',
                              hintStyle: GoogleFonts.poppins(color: Colors.grey, fontSize: 14),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () {},
                          child: Text('Appliquer', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: primaryColor)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Order Summary
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Résumé de la commande', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                        const Divider(height: 20),
                        _buildSummaryRow('Sous-total', '${subtotal.toInt()} FCFA'),
                        _buildSummaryRow('Frais de livraison', '${deliveryFee.toInt()} FCFA'),
                        _buildSummaryRow('Réduction', '0 FCFA'),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Total', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18)),
                            Text('${total.toInt()} FCFA', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 20, color: primaryColor)),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Payment methods preview
                  Text('Moyens de paiement acceptés', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: ['Wave 🌊', 'Orange Money 🍊', 'MTN MoMo 🟡', 'Espèces 💵'].map((pay) {
                      return Chip(
                        label: Text(pay, style: GoogleFonts.poppins(fontSize: 12)),
                        backgroundColor: Colors.white,
                        elevation: 0,
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: _items.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, -4))],
              ),
              child: Row(
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Total à payer', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12)),
                      Text('${total.toInt()} FCFA', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: primaryColor)),
                    ],
                  ),
                  const Spacer(),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: _onCheckout,
                    child: Text('Passer au paiement', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.poppins(color: const Color(0xFF6B7280), fontSize: 14)),
          Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}
