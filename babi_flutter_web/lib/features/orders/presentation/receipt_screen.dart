import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../domain/order_item_snapshot.dart';
import '../../cart/presentation/cart_screen.dart';
import '../../../core/services/pin_code_service.dart';
import '../../../core/services/quantum_security_service.dart';

class ReceiptScreen extends StatefulWidget {
  final String orderId;
  final String date;
  final String paymentMethod;
  final String cashierName;
  final List<OrderItemSnapshot>? items;
  final double? customTotal;
  final String? pickupPin;

  const ReceiptScreen({
    super.key,
    this.orderId = 'BAB-9842',
    this.date = 'Aujourd\'hui à 18:08',
    this.paymentMethod = 'Wave',
    this.cashierName = 'CAISSE 1 • Awa',
    this.items,
    this.customTotal,
    this.pickupPin,
  });

  @override
  State<ReceiptScreen> createState() => _ReceiptScreenState();
}

class _ReceiptScreenState extends State<ReceiptScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _slideAnimation;
  late Animation<double> _fadeAnimation;
  late final String _pin;
  int _rating = 5;
  bool _hasRated = false;

  @override
  void initState() {
    super.initState();
    _pin = widget.pickupPin ?? PinCodeService.generatePinForOrder(widget.orderId);
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _slideAnimation = Tween<double>(begin: -0.1, end: 0.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    _fadeAnimation = CurvedAnimation(parent: _animController, curve: Curves.easeIn);
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.black87, size: 20),
            const SizedBox(width: 10),
            Text('$label copié dans le presse-papier !', style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
          ],
        ),
        backgroundColor: const Color(0xFFFACC15),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _showQrFullscreen(String code) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Pass de Retrait', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.black12),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.qr_code_2, size: 180, color: Colors.black87),
                    const SizedBox(height: 10),
                    Text(
                      '#$code',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: 2),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Présentez ce QR Code à la caissière pour récupérer votre sac immédiatement.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFACC15),
                  foregroundColor: Colors.black87,
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Fermer', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showItemDetails(OrderItemSnapshot item) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.bakery_dining, color: Color(0xFFCA8A04), size: 30),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                      Text('${item.unitPrice.toInt()} FCFA l\'unité', style: const TextStyle(color: Colors.black54, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Quantité commandée :'),
                Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Sous-total calculé :'),
                Text('${item.subtotal.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFFCA8A04))),
              ],
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black87,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Fermer', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _simulatePrint() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.print, color: Colors.black87),
            SizedBox(width: 10),
            Text('Impression du reçu thermique envoyée !', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
          ],
        ),
        backgroundColor: const Color(0xFFFACC15),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _shareReceipt() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Partager le reçu de commande',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 18),
            ListTile(
              leading: const CircleAvatar(backgroundColor: Color(0xFF25D366), child: Icon(Icons.chat, color: Colors.white)),
              title: const Text('Envoyer par WhatsApp', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(ctx);
                _copyToClipboard('Commande #${widget.orderId} - Boulangerie de BABI', 'Lien');
              },
            ),
            ListTile(
              leading: const CircleAvatar(backgroundColor: Color(0xFF1EA5FC), child: Icon(Icons.share, color: Colors.white)),
              title: const Text('Copier les détails de la commande', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(ctx);
                _copyToClipboard('Commande #${widget.orderId} payée (${widget.paymentMethod}) - Boulangerie de BABI', 'Reçu');
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final receiptItems = widget.items ?? [
      const OrderItemSnapshot(productName: 'AMÉRICAIN', unitPrice: 700, quantity: 1),
      const OrderItemSnapshot(productName: 'CROISSANT AU BEURRE', unitPrice: 500, quantity: 2),
    ];

    final double calculatedTotal = widget.customTotal ?? receiptItems.fold<double>(0.0, (double sum, OrderItemSnapshot it) => sum + it.subtotal);
    final int totalItemsCount = receiptItems.fold<int>(0, (int sum, OrderItemSnapshot it) => sum + it.quantity);

    return Scaffold(
      backgroundColor: const Color(0xFFE5E7EB),
      appBar: AppBar(
        title: const Text('Ticket de Caisse Interactif', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Colors.black87)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.print_outlined, color: Colors.black87),
            tooltip: 'Imprimer',
            onPressed: _simulatePrint,
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Colors.black87),
            tooltip: 'Partager',
            onPressed: _shareReceipt,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              children: [
                // Quick Action Bar above receipt
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 10)],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildQuickActionButton(Icons.qr_code, 'Agrandir QR', () => _showQrFullscreen(widget.orderId)),
                      _buildQuickActionButton(Icons.copy, 'Copier N°', () => _copyToClipboard(widget.orderId, 'N° Commande')),
                      _buildQuickActionButton(Icons.download, 'Sauvegarder', _simulatePrint),
                      _buildQuickActionButton(Icons.share, 'Partager', _shareReceipt),
                    ],
                  ),
                ),

                // Animated Receipt
                AnimatedBuilder(
                  animation: _animController,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(0, _slideAnimation.value * 50),
                      child: Opacity(
                        opacity: _fadeAnimation.value,
                        child: child,
                      ),
                    );
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [
                        BoxShadow(color: Color(0x14000000), blurRadius: 16, offset: Offset(0, 8)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Zigzag cut top effect
                        _buildZigzagCut(),

                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                          child: DefaultTextStyle(
                            style: const TextStyle(
                              fontFamily: 'Courier',
                              fontSize: 13,
                              color: Colors.black87,
                              height: 1.4,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Logo & Header
                                Center(
                                  child: Image.asset(
                                    'assets/logo.webp',
                                    height: 70,
                                    width: 70,
                                    fit: BoxFit.contain,
                                    errorBuilder: (context, error, stackTrace) => const Icon(Icons.bakery_dining, size: 50, color: Color(0xFFFACC15)),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'BOULANGERIE DE BABI',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                const Text(
                                  'Cocody Danga • Abidjan, Côte d\'Ivoire\nTEL: +225 27 22 56 41 23',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 11),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  '*** TICKET DE CAISSE CLIENT ***',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 14),

                                 // Order Metadata with Copy triggers
                                 InkWell(
                                   onTap: () => _copyToClipboard(widget.orderId, 'N° Commande'),
                                   child: _buildMetaLine('N° Commande:', '#${widget.orderId} 📋'),
                                 ),
                                 InkWell(
                                   onTap: () => _copyToClipboard(_pin, 'Code PIN'),
                                   child: _buildMetaLine('CODE PIN RETRAIT:', '🔑 ${PinCodeService.formatPin(_pin)} 📋'),
                                 ),
                                 _buildMetaLine('Date / Heure:', widget.date),
                                 _buildMetaLine('Opérateur:', widget.cashierName),
                                 _buildMetaLine('Moyen Paiement:', '${widget.paymentMethod} (En ligne)'),
                                 const SizedBox(height: 12),

                                // Table Header
                                const Text('==========================================', maxLines: 1),
                                const Row(
                                  children: [
                                    Expanded(flex: 4, child: Text('PRODUIT (Cliquer)', style: TextStyle(fontWeight: FontWeight.bold))),
                                    Expanded(flex: 2, child: Text('P.U', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold))),
                                    Expanded(flex: 1, child: Text('QTÉ', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold))),
                                    Expanded(flex: 3, child: Text('S-TOTAL', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold))),
                                  ],
                                ),
                                const Text('------------------------------------------', maxLines: 1),

                                // Interactive Articles Rows
                                ...receiptItems.map((item) {
                                  return InkWell(
                                    onTap: () => _showItemDetails(item),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 3.0),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Expanded(
                                            flex: 4,
                                            child: Text(
                                              '• ${item.productName.toUpperCase()}',
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontWeight: FontWeight.w600),
                                            ),
                                          ),
                                          Expanded(
                                            flex: 2,
                                            child: Text('${item.unitPrice.toInt()} F', textAlign: TextAlign.right),
                                          ),
                                          Expanded(
                                            flex: 1,
                                            child: Text('x${item.quantity}', textAlign: TextAlign.right),
                                          ),
                                          Expanded(
                                            flex: 3,
                                            child: Text('${item.subtotal.toInt()} F', textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.bold)),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }),

                                const Text('==========================================', maxLines: 1),
                                const SizedBox(height: 6),
                                Text('Nombre total d\'articles : $totalItemsCount'),
                                const SizedBox(height: 12),

                                // Totals
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('TOTAL DE LA COMMANDE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    Text('${calculatedTotal.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Règlement (${widget.paymentMethod})'),
                                    Text('${calculatedTotal.toInt()} FCFA'),
                                  ],
                                ),
                                const Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Statut transaction :'),
                                    Text('PAYÉ & VALIDÉ ✓', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
                                  ],
                                ),
                                const SizedBox(height: 18),

                                // Interactive Scannable QR Code Box
                                InkWell(
                                  onTap: () => _showQrFullscreen(widget.orderId),
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF9FAFB),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Colors.black12),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.qr_code, size: 52, color: Colors.black87),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Text('PASS RETRAIT AU COMPTOIR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                              Text('Code : #${widget.orderId}', style: const TextStyle(color: Colors.black54, fontSize: 11)),
                                              const Text('🔍 Toucher pour agrandir', style: TextStyle(color: Color(0xFFCA8A04), fontSize: 10, fontWeight: FontWeight.bold)),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),

                                // ⚛️ Badge de Scellement Cryptographique Merkle Inviolable
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0F172A),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.verified_user_rounded, color: Color(0xFFFACC15), size: 16),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          QuantumSecurityService.formatCertifiedBadge(
                                            QuantumSecurityService.generateReceiptFingerprint(
                                              orderId: widget.orderId,
                                              totalAmount: calculatedTotal,
                                              pickupPin: _pin,
                                              timestamp: widget.date,
                                            ),
                                          ),
                                          style: const TextStyle(
                                            color: Color(0xFFFACC15),
                                            fontSize: 10,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 0.8,
                                            fontFamily: 'monospace',
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Interactive 5-Star Rating Section
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFFBEB),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Text(
                                        _hasRated ? 'Merci pour votre note de $_rating/5 ⭐ !' : 'Notez votre expérience en boulangerie :',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: List.generate(5, (index) {
                                          final starIndex = index + 1;
                                          return InkWell(
                                            onTap: () {
                                              setState(() {
                                                _rating = starIndex;
                                                _hasRated = true;
                                              });
                                              HapticFeedback.lightImpact();
                                            },
                                            child: Padding(
                                              padding: const EdgeInsets.symmetric(horizontal: 4),
                                              child: Icon(
                                                starIndex <= _rating ? Icons.star : Icons.star_border,
                                                color: const Color(0xFFF59E0B),
                                                size: 26,
                                              ),
                                            ),
                                          );
                                        }),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 18),

                                const Center(child: Text('Merci pour votre visite !')),
                                const Center(child: Text('www.boulangeriedebabi.ci')),
                              ],
                            ),
                          ),
                        ),

                        // Zigzag cut bottom effect
                        _buildZigzagCut(isBottom: true),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Re-order Button
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
                  },
                  icon: const Icon(Icons.replay, color: Colors.black87),
                  label: const Text('Recommander ces articles', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFACC15),
                    foregroundColor: Colors.black87,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetaLine(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 125, child: Text(label)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }

  Widget _buildQuickActionButton(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: const Color(0xFFCA8A04)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87)),
          ],
        ),
      ),
    );
  }

  Widget _buildZigzagCut({bool isBottom = false}) {
    return SizedBox(
      height: 10,
      child: CustomPaint(
        painter: _ZigzagPainter(isBottom: isBottom),
      ),
    );
  }
}

class _ZigzagPainter extends CustomPainter {
  final bool isBottom;
  _ZigzagPainter({required this.isBottom});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE5E7EB)
      ..style = PaintingStyle.fill;

    final path = Path();
    const toothWidth = 14.0;
    final toothCount = (size.width / toothWidth).ceil();

    if (!isBottom) {
      path.moveTo(0, size.height);
      for (int i = 0; i < toothCount; i++) {
        final x = i * toothWidth;
        path.lineTo(x + toothWidth / 2, 0);
        path.lineTo(x + toothWidth, size.height);
      }
      path.lineTo(size.width, size.height);
      path.lineTo(size.width, 0);
      path.lineTo(0, 0);
      path.close();
    } else {
      path.moveTo(0, 0);
      for (int i = 0; i < toothCount; i++) {
        final x = i * toothWidth;
        path.lineTo(x + toothWidth / 2, size.height);
        path.lineTo(x + toothWidth, 0);
      }
      path.lineTo(size.width, 0);
      path.lineTo(size.width, size.height);
      path.lineTo(0, size.height);
      path.close();
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
