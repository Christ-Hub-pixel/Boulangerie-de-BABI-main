import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../orders/presentation/order_tracking_screen.dart';
import '../../orders/presentation/receipt_screen.dart';
import '../../orders/domain/order_item_snapshot.dart';
import '../../../core/services/pin_code_service.dart';

/// Modal Bottom Sheet & Flow complet pour le règlement en Espèces au comptoir
class CashPaymentSheet extends StatefulWidget {
  final double totalAmount;
  final String orderId;
  final List<OrderItemSnapshot> items;
  final VoidCallback onOrderPlaced;

  const CashPaymentSheet({
    super.key,
    required this.totalAmount,
    required this.orderId,
    required this.items,
    required this.onOrderPlaced,
  });

  static Future<void> show(
    BuildContext context, {
    required double totalAmount,
    required String orderId,
    required List<OrderItemSnapshot> items,
    required VoidCallback onOrderPlaced,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CashPaymentSheet(
        totalAmount: totalAmount,
        orderId: orderId,
        items: items,
        onOrderPlaced: onOrderPlaced,
      ),
    );
  }

  @override
  State<CashPaymentSheet> createState() => _CashPaymentSheetState();
}

class _CashPaymentSheetState extends State<CashPaymentSheet> {
  late double _selectedBill;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    // Default to exact amount or next convenient bill
    _selectedBill = widget.totalAmount;
  }

  double get _calculatedChange => (_selectedBill - widget.totalAmount).clamp(0.0, 100000.0);

  List<double> _getSuggestedBills() {
    final t = widget.totalAmount;
    final bills = <double>[t]; // Appoint exact
    if (t < 2000) bills.add(2000);
    if (t < 5000) bills.add(5000);
    if (t < 10000) bills.add(10000);
    if (t < 20000) bills.add(20000);
    return bills.toSet().toList()..sort();
  }

  Future<void> _confirmCashOrder() async {
    setState(() => _isProcessing = true);
    await Future.delayed(const Duration(milliseconds: 600));

    if (!mounted) return;
    setState(() => _isProcessing = false);

    widget.onOrderPlaced();
    Navigator.pop(context);

    // Navigate to Success & Order Tracking
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CashSuccessScreen(
          orderId: widget.orderId,
          totalAmount: widget.totalAmount,
          billAmount: _selectedBill,
          changeAmount: _calculatedChange,
          items: widget.items,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final suggestedBills = _getSuggestedBills();

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).viewInsets.bottom + 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  color: Color(0xFFFEF3C7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.payments_outlined, color: Color(0xFFD97706), size: 24),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Paiement en Espèces',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.black87),
                    ),
                    Text(
                      'Règlement direct au comptoir du retrait',
                      style: TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.black54),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Total Box
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Montant total à payer', style: TextStyle(fontSize: 12, color: Colors.black54)),
                    SizedBox(height: 2),
                    Text('Au comptoir', style: TextStyle(fontSize: 10, color: Color(0xFFCA8A04), fontWeight: FontWeight.bold)),
                  ],
                ),
                Text(
                  '${widget.totalAmount.toInt()} FCFA',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: Color(0xFF92400E)),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Bill Choice
          const Text(
            'Avec quel billet allez-vous régler ? (Pour préparer la monnaie)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
          ),
          const SizedBox(height: 10),

          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: suggestedBills.map((bill) {
              final isExact = (bill == widget.totalAmount);
              final isSelected = (_selectedBill == bill);

              return InkWell(
                onTap: () {
                  setState(() => _selectedBill = bill);
                  HapticFeedback.selectionClick();
                },
                borderRadius: BorderRadius.circular(16),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFFACC15) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? const Color(0xFFCA8A04) : Colors.transparent,
                      width: 1.5,
                    ),
                  ),
                  child: Text(
                    isExact ? 'Appoint exact (${bill.toInt()} F)' : '${bill.toInt()} FCFA',
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.w900 : FontWeight.bold,
                      color: isSelected ? Colors.black87 : Colors.black87,
                      fontSize: 12,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          if (_calculatedChange > 0) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.currency_exchange, color: Color(0xFF16A34A), size: 18),
                      SizedBox(width: 8),
                      Text('Monnaie à vous rendre :', style: TextStyle(color: Color(0xFF166534), fontSize: 12)),
                    ],
                  ),
                  Text(
                    '${_calculatedChange.toInt()} FCFA',
                    style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF15803D), fontSize: 14),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Validate CTA
          ElevatedButton(
            onPressed: _isProcessing ? null : _confirmCashOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFACC15),
              foregroundColor: Colors.black87,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 0,
            ),
            child: _isProcessing
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.black87),
                  )
                : const Text(
                    'Confirmer la commande en espèces',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                  ),
          ),
        ],
      ),
    );
  }
}

/// Écran de confirmation de commande en Espèces
class CashSuccessScreen extends StatelessWidget {
  final String orderId;
  final double totalAmount;
  final double billAmount;
  final double changeAmount;
  final List<OrderItemSnapshot> items;

  const CashSuccessScreen({
    super.key,
    required this.orderId,
    required this.totalAmount,
    required this.billAmount,
    required this.changeAmount,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    final cleanOrderId = orderId.replaceAll('CMD-', 'BAB-');
    final pin = PinCodeService.generatePinForOrder(cleanOrderId);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Success Badge
              Center(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.green.withValues(alpha: 0.2), blurRadius: 16, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: const Icon(Icons.storefront_rounded, color: Color(0xFF16A34A), size: 40),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Commande Préparée pour Retrait ! 🥖',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.black87),
              ),
              const SizedBox(height: 6),
              Text(
                'Commande #$cleanOrderId • Paiement Espèces au comptoir',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),

              const SizedBox(height: 24),

              // Pickup Pass
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(color: Color(0x08000000), blurRadius: 10, offset: Offset(0, 4)),
                  ],
                ),
                child: Column(
                  children: [
                    const Text('VOTRE PASS DE RETRAIT EN BOUTIQUE', style: TextStyle(fontSize: 10, letterSpacing: 1.2, fontWeight: FontWeight.w900, color: Colors.black45)),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Text(
                        '#$cleanOrderId',
                        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 2, color: Color(0xFF92400E)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    InkWell(
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: pin));
                        HapticFeedback.lightImpact();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Code PIN $pin copié !'),
                            backgroundColor: const Color(0xFFFACC15),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                              'PIN SECRET DE RETRAIT : ${PinCodeService.formatPin(pin)}',
                              style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Présentez ce numéro et votre PIN secret à la caissière lors de votre arrivée pour retirer vos articles frais et régler.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.black54, height: 1.4),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Summary Box
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Règlement prévu au comptoir', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total à régler :', style: TextStyle(color: Colors.black54, fontSize: 13)),
                        Text('${totalAmount.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Billet prévu :', style: TextStyle(color: Colors.black54, fontSize: 13)),
                        Text('${billAmount.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                    if (changeAmount > 0) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Monnaie à recevoir :', style: TextStyle(color: Color(0xFF16A34A), fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('${changeAmount.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF16A34A), fontSize: 14)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Action buttons
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => OrderTrackingScreen(
                        orderId: cleanOrderId,
                        totalAmount: totalAmount,
                        paymentMethod: 'Espèces (Au comptoir)',
                        currentStep: 0,
                        items: items,
                        pickupPin: pin,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.location_on, color: Colors.black87),
                label: const Text('Suivre la préparation en direct', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black87)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFACC15),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  elevation: 0,
                ),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ReceiptScreen(
                        orderId: cleanOrderId,
                        paymentMethod: 'Espèces (Au comptoir)',
                        items: items,
                        customTotal: totalAmount,
                        pickupPin: pin,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.receipt_long, color: Colors.black87),
                label: const Text('Voir le ticket proforma', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: Colors.black26),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
