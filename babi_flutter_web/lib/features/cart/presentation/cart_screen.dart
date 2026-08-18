import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/cart_provider.dart';
import '../../home/presentation/home_screen.dart';
import '../../orders/presentation/order_tracking_screen.dart';
import '../../orders/presentation/receipt_screen.dart';
import '../../orders/domain/order_item_snapshot.dart';
import 'wave_payment_flow.dart';
import '../../../core/providers/product_provider.dart';
import '../../../core/services/pin_code_service.dart';

import 'cash_payment_flow.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  String selectedPayment = 'Wave';
  
  // Promo code support
  final TextEditingController _promoController = TextEditingController();
  String? _appliedPromoCode;
  double _discountPercent = 0.0;
  double _discountFixed = 0.0;
  
  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }
  
  void _applyPromoCode() {
    final code = _promoController.text.trim().toUpperCase();
    if (code.isEmpty) return;
    
    setState(() {
      if (code == 'BABI10') {
        _discountPercent = 0.10;
        _discountFixed = 0.0;
        _appliedPromoCode = code;
        _showPromoSnackBar('Code BABI10 appliqué : -10% sur votre panier ! 🎉', isSuccess: true);
      } else if (code == 'BABI500') {
        _discountPercent = 0.0;
        _discountFixed = 500.0;
        _appliedPromoCode = code;
        _showPromoSnackBar('Code BABI500 appliqué : -500 FCFA de réduction ! 🥖', isSuccess: true);
      } else if (code == 'CROISSANT') {
        _discountPercent = 0.15;
        _discountFixed = 0.0;
        _appliedPromoCode = code;
        _showPromoSnackBar('Code CROISSANT appliqué : -15% spécial viennoiserie ! ✨', isSuccess: true);
      } else {
        _showPromoSnackBar('Code promo invalide. Essayez BABI10 ou BABI500', isSuccess: false);
      }
    });
  }
  
  void _showPromoSnackBar(String message, {required bool isSuccess}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: isSuccess ? const Color(0xFF16A34A) : Colors.redAccent,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Future<void> _processPayment(double total) async {
    // Transformer les items du panier en snapshots immuables avec leurs prix
    final cartItems = ref.read(cartProvider);
    final snapshotItems = cartItems.map((it) => OrderItemSnapshot(
      productName: it.name,
      unitPrice: it.price,
      quantity: it.quantity,
    )).toList();
    final orderId = 'BAB-${1000 + (DateTime.now().millisecondsSinceEpoch % 9000)}';
    final pickupPin = PinCodeService.generatePinForOrder(orderId);

    // Si Wave est sélectionné, ouvrir le flow complet Wave officiel
    if (selectedPayment == 'Wave') {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) => WavePaymentSheet(
          totalAmount: total,
          orderId: orderId,
          items: snapshotItems,
          onProceedToSimulation: () {
            ref.read(cartProvider.notifier).clearCart();
            Navigator.pop(ctx); // Ferme la bottom sheet
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => WaveCheckoutScreen(
                  totalAmount: total,
                  orderId: orderId,
                  items: snapshotItems,
                ),
              ),
            );
          },
        ),
      );
      return;
    }

    // Si Espèces est sélectionné, ouvrir la modal de paiement espèces au comptoir
    if (selectedPayment == 'Espèces') {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) => CashPaymentSheet(
          totalAmount: total,
          orderId: orderId,
          items: snapshotItems,
          onOrderPlaced: () {
            ref.read(cartProvider.notifier).clearCart();
          },
        ),
      );
      return;
    }

    // Afficher indicateur de chargement
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Color(0xFFFACC15)),
                  SizedBox(height: 24),
                  Text(
                    'Validation de la commande en caisse...',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    // Simuler le délai de validation réseau
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    
    // Fermer le dialogue de chargement
    Navigator.of(context).pop();

    // Vider le panier
    ref.read(cartProvider.notifier).clearCart();

    // Afficher le dialogue de succès avec accès au reçu thermique détaillé
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          child: Padding(
            padding: const EdgeInsets.all(28.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle, color: Colors.green, size: 56),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Commande Validée !',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Colors.black87),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Montant : ${total.toInt()} FCFA ($selectedPayment)\nPrix unitaires enregistrés avec succès.',
                  style: const TextStyle(color: Colors.black54, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF18181B),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.lock, color: Color(0xFFFACC15), size: 14),
                      const SizedBox(width: 8),
                      Text(
                        'PIN RETRAIT : ${PinCodeService.formatPin(pickupPin)}',
                        style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(
                        builder: (context) => OrderTrackingScreen(
                          orderId: orderId,
                          totalAmount: total,
                          paymentMethod: selectedPayment,
                          currentStep: 1,
                          items: snapshotItems,
                          pickupPin: pickupPin,
                        ),
                      ),
                      (route) => false,
                    );
                  },
                  icon: const Icon(Icons.storefront, color: Colors.black87),
                  label: const Text('Suivi de ma commande', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFACC15),
                    foregroundColor: Colors.black87,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ReceiptScreen(
                          orderId: orderId,
                          date: 'Aujourd\'hui, 16:45',
                          paymentMethod: selectedPayment,
                          items: snapshotItems,
                          customTotal: total,
                          pickupPin: pickupPin,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.receipt_long, size: 16, color: Colors.black87),
                  label: const Text('Consulter le reçu détaillé', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 13)),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 44),
                    side: const BorderSide(color: Colors.black26),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
                const SizedBox(height: 6),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (context) => const HomeScreen()),
                      (route) => false,
                    );
                  },
                  child: const Text('Retour à l\'accueil', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = ref.watch(cartProvider);
    final subtotal = cartItems.fold(0.0, (sum, item) => sum + (item.price * item.quantity));
    final discount = (subtotal * _discountPercent) + _discountFixed;
    final total = (subtotal - discount).clamp(0.0, 9999999.0);

    return Container(
      decoration: const BoxDecoration(
        image: DecorationImage(
          image: AssetImage('assets/fond arriere d ecran de commande.webp'),
          fit: BoxFit.cover,
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        extendBodyBehindAppBar: true,
        body: Stack(
          children: [
          
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                // AppBar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, size: 28),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      const Expanded(
                        child: Text(
                          'Ma commande',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 28),
                        onPressed: () {
                          ref.read(cartProvider.notifier).clearCart();
                        },
                      ),
                    ],
                  ),
                ),
                
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.only(bottom: 100),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [

                        
                        // Vos produits title
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Row(
                            children: [
                              const Icon(Icons.shopping_bag_outlined, color: Color(0xFFFACC15)),
                              const SizedBox(width: 8),
                              Text('Vos produits (${cartItems.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 12),
                        
                        // Cart Items List
                        if (cartItems.isEmpty)
                          const Padding(
                            padding: EdgeInsets.all(32.0),
                            child: Center(child: Text("Votre panier est vide")),
                          )
                        else
                          ...cartItems.map((item) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: const [
                                  BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4)),
                                ],
                              ),
                              child: Row(
                                children: [
                                  // Product image
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Container(
                                      width: 80,
                                      height: 60,
                                      color: const Color(0xFFF5F5F5),
                                      child: _getCartItemImage(item.id),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(child: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold))),
                                            InkWell(
                                              onTap: () => ref.read(cartProvider.notifier).removeItem(item.id),
                                              child: const Icon(Icons.close, color: Colors.black26, size: 18),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 12),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text('${item.price.toInt()} F / unité', style: const TextStyle(color: Colors.black54, fontSize: 11)),
                                                const SizedBox(height: 2),
                                                Text(
                                                  '${(item.price * item.quantity).toInt()} FCFA',
                                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.black87),
                                                ),
                                              ],
                                            ),
                                            
                                            // Quantity Controls
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF5F5F5),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  InkWell(
                                                    onTap: () => ref.read(cartProvider.notifier).decreaseQuantity(item.id),
                                                    child: Container(
                                                      padding: const EdgeInsets.all(4),
                                                      decoration: const BoxDecoration(
                                                        color: Color(0xFFFACC15),
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: const Icon(Icons.remove, color: Colors.black87, size: 14),
                                                    ),
                                                  ),
                                                  Padding(
                                                    padding: const EdgeInsets.symmetric(horizontal: 10.0),
                                                    child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                                  ),
                                                  InkWell(
                                                    onTap: () => ref.read(cartProvider.notifier).increaseQuantity(item.id),
                                                    child: Container(
                                                      padding: const EdgeInsets.all(4),
                                                      decoration: const BoxDecoration(
                                                        color: Color(0xFFFACC15),
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: const Icon(Icons.add, color: Colors.black87, size: 14),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )),
                          
                        const SizedBox(height: 16),
                        
                        // Promo Code
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Container(
                            padding: const EdgeInsets.only(left: 16, right: 4, top: 4, bottom: 4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: _appliedPromoCode != null ? const Color(0xFF16A34A) : Colors.grey.shade200,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.local_offer_outlined,
                                  color: _appliedPromoCode != null ? const Color(0xFF16A34A) : Colors.black38,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextField(
                                    controller: _promoController,
                                    textCapitalization: TextCapitalization.characters,
                                    decoration: InputDecoration(
                                      hintText: _appliedPromoCode != null ? 'Code appliqué : $_appliedPromoCode' : 'Ajouter un code (ex: BABI10)',
                                      hintStyle: TextStyle(
                                        color: _appliedPromoCode != null ? const Color(0xFF16A34A) : Colors.black38,
                                        fontWeight: _appliedPromoCode != null ? FontWeight.bold : FontWeight.normal,
                                        fontSize: 13,
                                      ),
                                      border: InputBorder.none,
                                    ),
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: _applyPromoCode,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFFFF9E6),
                                    foregroundColor: const Color(0xFFCA8A04),
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  ),
                                  child: const Text('Appliquer', style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Récapitulatif Title
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Row(
                            children: const [
                              Icon(Icons.receipt_long_outlined, color: Color(0xFFFACC15)),
                              SizedBox(width: 8),
                              Text('Récapitulatif', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        
                        // Récapitulatif Box
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: const [
                                BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4)),
                              ],
                            ),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Sous-total', style: TextStyle(color: Colors.black54, fontSize: 13)),
                                    Text('${subtotal.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  ],
                                ),
                                if (discount > 0) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Remise promo ($_appliedPromoCode)', style: const TextStyle(color: Color(0xFF16A34A), fontSize: 13, fontWeight: FontWeight.bold)),
                                      Text('- ${discount.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF16A34A))),
                                    ],
                                  ),
                                ],
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: const [
                                    Text('Frais de retrait au comptoir', style: TextStyle(color: Colors.black54, fontSize: 13)),
                                    Text('0 FCFA', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF16A34A))),
                                  ],
                                ),
                                const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 10),
                                  child: Divider(height: 1, color: Color(0xFFF1F5F9)),
                                ),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Total à payer', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                                    Text(
                                      '${total.toInt()} FCFA',
                                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFFCA8A04)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Removed Adresse de livraison
                        
                        const SizedBox(height: 24),
                        
                        // Mode de paiement Title
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Row(
                            children: const [
                              Icon(Icons.credit_card_outlined, color: Color(0xFFFACC15)),
                              SizedBox(width: 8),
                              Text('Mode de paiement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        
                        // Payment Methods (Wave et Espèces uniquement)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: [
                              Expanded(
                                child: _buildPaymentMethod('Wave', 'assets/wave_money.webp', null),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildPaymentMethod('Espèces', null, Icons.payments_outlined),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Floating Validate Button
          if (cartItems.isNotEmpty)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: SafeArea(
                child: ElevatedButton(
                  onPressed: () => _processPayment(total),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFACC15),
                    foregroundColor: Colors.black87,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    elevation: 4,
                  ),
                  child: Text('Valider la commande • ${total.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ),
        ],
      ),
      ),
    );
  }

  Widget _buildPaymentMethod(String name, String? assetPath, IconData? fallbackIcon) {
    final isSelected = selectedPayment == name;
    
    return InkWell(
      onTap: () {
        setState(() {
          selectedPayment = name;
        });
      },
      borderRadius: BorderRadius.circular(18),
      child: Container(
        height: 86,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFFBEB) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? const Color(0xFFFACC15) : const Color(0xFFE5E7EB),
            width: isSelected ? 2.0 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected ? const Color(0xFFFACC15).withValues(alpha: 0.15) : Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (assetPath != null)
              Image.asset(
                assetPath,
                height: 32,
                width: 32,
                errorBuilder: (context, error, stack) => const Icon(Icons.payment, color: Colors.black54),
              )
            else if (fallbackIcon != null)
              Icon(fallbackIcon, size: 30, color: isSelected ? const Color(0xFFCA8A04) : Colors.black54),
              
            const SizedBox(height: 6),
            Text(
              name == 'Wave' ? 'Paiement Wave' : 'Espèces au comptoir',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: isSelected ? const Color(0xFF92400E) : Colors.black87,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
  
  // Helper to fetch the image for a product
  Widget _getCartItemImage(String id) {
    try {
      final asyncProducts = ref.read(productsProvider);
      return asyncProducts.maybeWhen(
        data: (products) {
          final product = products.firstWhere((p) => p['id'].toString() == id);
          return Image.asset(
            product['image'] as String,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => const Icon(Icons.image_not_supported, color: Colors.black26),
          );
        },
        orElse: () => const Icon(Icons.image_not_supported, color: Colors.black26),
      );
    } catch (e) {
      return const Icon(Icons.image_not_supported, color: Colors.black26);
    }
  }
}
