import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'receipt_screen.dart';
import 'product_review_sheet.dart';
import '../../support/presentation/support_screen.dart';
import '../../../core/services/pin_code_service.dart';
import '../domain/order_item_snapshot.dart';

class OrderTrackingScreen extends StatefulWidget {
  final String orderId;
  final double totalAmount;
  final String paymentMethod;
  final int currentStep; // 0: Reçue, 1: Payée, 2: En préparation, 3: Prête, 4: Terminée
  final List<OrderItemSnapshot>? items;
  final String? pickupPin;

  const OrderTrackingScreen({
    super.key,
    this.orderId = 'BAB-9842',
    this.totalAmount = 8500,
    this.paymentMethod = 'Wave',
    this.currentStep = 2,
    this.items,
    this.pickupPin,
  });

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> with SingleTickerProviderStateMixin {
  late int _step;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late final String _pin;

  final List<Map<String, dynamic>> _steps = [
    {
      'title': 'Commande confirmée',
      'subtitle': 'Commande enregistrée avec succès.',
      'time': 'Aujourd\'hui à 18:08',
      'icon': Icons.check_circle,
    },
    {
      'title': 'Paiement reçu',
      'subtitle': 'Paiement Wave validé.',
      'time': 'Aujourd\'hui à 18:08',
      'icon': Icons.check_circle,
    },
    {
      'title': 'En préparation',
      'subtitle': 'Nous préparons vos produits avec soin.',
      'time': 'En cours',
      'icon': Icons.outdoor_grill,
    },
    {
      'title': 'Prête à être récupérée',
      'subtitle': 'Au comptoir de la boulangerie.',
      'time': 'À venir',
      'icon': Icons.shopping_bag_outlined,
    },
    {
      'title': 'Commande récupérée',
      'subtitle': 'Commande remise au client.',
      'time': 'À venir',
      'icon': Icons.storefront,
    },
  ];

  @override
  void initState() {
    super.initState();
    _step = widget.currentStep;
    _pin = widget.pickupPin ?? PinCodeService.generatePinForOrder(widget.orderId);
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.22).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEFDF9),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFACC15),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Suivi Commande #${widget.orderId}',
          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.receipt_outlined, color: Colors.black87),
            tooltip: 'Voir le reçu',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ReceiptScreen(
                    orderId: widget.orderId,
                    paymentMethod: widget.paymentMethod,
                    customTotal: widget.totalAmount,
                    items: widget.items,
                    pickupPin: _pin,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Animated Time Card
            TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0.9, end: 1.0),
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeOutBack,
              builder: (context, scale, child) {
                return Transform.scale(
                  scale: scale,
                  child: child,
                );
              },
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFACC15), Color(0xFFFDE047)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFACC15).withValues(alpha: 0.4),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _step < 4 ? _pulseAnimation.value : 1.0,
                          child: child,
                        );
                      },
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.storefront_rounded, color: Color(0xFFCA8A04), size: 32),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Retrait au comptoir estimé',
                            style: TextStyle(fontSize: 12, color: Colors.black54, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 400),
                            child: Text(
                              _step >= 3 ? (_step == 4 ? 'Commande terminée ! ✨' : 'Prête à être retirée ! 🎉') : '15 - 20 minutes',
                              key: ValueKey<int>(_step),
                              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900, color: Colors.black87),
                            ),
                          ),
                          const Text(
                            'Boulangerie BABI • Comptoir Cocody Danga',
                            style: TextStyle(fontSize: 12, color: Colors.black87),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 22),
            
            // Pickup Pass / Code Card for Cashier with secret PIN
            AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: _step == 3 ? const Color(0xFFFACC15) : const Color(0xFF27272A),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _step == 3
                        ? const Color(0xFFFACC15).withValues(alpha: 0.3)
                        : Colors.black.withValues(alpha: 0.2),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFACC15),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.qr_code_scanner_rounded, color: Colors.black87, size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'PASS DE RETRAIT AU COMPTOIR',
                              style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.1),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '#${widget.orderId}',
                              style: const TextStyle(
                                color: Color(0xFFFACC15),
                                fontWeight: FontWeight.w900,
                                fontSize: 20,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF27272A),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.lock, color: Color(0xFFFACC15), size: 12),
                            SizedBox(width: 4),
                            Text('Sécurisé', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1, color: Color(0xFF27272A)),
                  const SizedBox(height: 14),

                  // PIN Code Display
                  InkWell(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: _pin));
                      HapticFeedback.lightImpact();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Row(
                            children: [
                              const Icon(Icons.key, color: Colors.black87, size: 20),
                              const SizedBox(width: 10),
                              Text('Code PIN $_pin copié dans le presse-papier !', style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          backgroundColor: const Color(0xFFFACC15),
                          duration: const Duration(seconds: 2),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('CODE PIN DE RETRAIT', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.8)),
                              SizedBox(height: 2),
                              Text('À donner à la caissière (Toucher pour copier)', style: TextStyle(color: Colors.white38, fontSize: 10)),
                            ],
                          ),
                          Row(
                            children: _pin.split('').map((digit) {
                              return Container(
                                margin: const EdgeInsets.only(left: 6),
                                width: 32,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF27272A),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.6), width: 1.5),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  digit,
                                  style: const TextStyle(
                                    color: Color(0xFFFACC15),
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            if (widget.items != null && widget.items!.isNotEmpty) ...[
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: const [
                    BoxShadow(color: Color(0x08000000), blurRadius: 16, offset: Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.shopping_bag_outlined, color: Color(0xFFCA8A04), size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Articles commandés',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                            ),
                          ],
                        ),
                        Text(
                          '${widget.totalAmount.toInt()} FCFA',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF16A34A)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    ...widget.items!.map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: Text(
                                    '${item.quantity}x',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFFB45309)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  item.productName,
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.black87),
                                ),
                              ),
                              Text(
                                '${item.subtotal.toInt()} FCFA',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
                              ),
                            ],
                          ),
                        )),
                    const Divider(height: 20, color: Color(0xFFF1F5F9)),
                    InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ReceiptScreen(
                              orderId: widget.orderId,
                              paymentMethod: widget.paymentMethod,
                              customTotal: widget.totalAmount,
                              items: widget.items,
                            ),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFDE68A)),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long, color: Color(0xFFB45309), size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Ouvrir le Ticket / Reçu de caisse ➔',
                              style: TextStyle(color: Color(0xFFB45309), fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 22),
            
            // Stepper Card with interactive animated progress
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x08000000),
                    blurRadius: 16,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.timeline_rounded, color: Color(0xFFCA8A04), size: 22),
                          SizedBox(width: 8),
                          Text(
                            'Statut de votre commande',
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.black87),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF9E6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'Étape ${_step + 1}/5',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFB45309), fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Steps List with micro-animations
                  ...List.generate(_steps.length, (index) {
                    final item = _steps[index];
                    final isDone = index < _step;
                    final isCurrent = index == _step;
                    final isLast = index == _steps.length - 1;

                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 350),
                      curve: Curves.easeInOut,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Indicator Column
                          Column(
                            children: [
                              if (isCurrent)
                                AnimatedBuilder(
                                  animation: _pulseAnimation,
                                  builder: (context, child) {
                                    return Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Container(
                                          width: 38 * _pulseAnimation.value,
                                          height: 38 * _pulseAnimation.value,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: const Color(0xFFFACC15).withValues(alpha: 0.25),
                                          ),
                                        ),
                                        child!,
                                      ],
                                    );
                                  },
                                  child: Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFACC15),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.black87, width: 2),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFFACC15).withValues(alpha: 0.5),
                                          blurRadius: 10,
                                        ),
                                      ],
                                    ),
                                    child: Icon(item['icon'] as IconData, size: 20, color: Colors.black87),
                                  ),
                                )
                              else
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 400),
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isDone ? const Color(0xFF22C55E) : const Color(0xFFF3F4F6),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    isDone ? Icons.check_rounded : item['icon'] as IconData,
                                    size: isDone ? 20 : 18,
                                    color: isDone ? Colors.white : Colors.black26,
                                  ),
                                ),
                              if (!isLast)
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 500),
                                  width: 3,
                                  height: 44,
                                  color: isDone ? const Color(0xFF22C55E) : const Color(0xFFE5E7EB),
                                ),
                            ],
                          ),
                          const SizedBox(width: 14),
                          
                          // Text info
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 22.0, top: 4),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        item['title'] as String,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: isCurrent ? FontWeight.bold : (isDone ? FontWeight.w600 : FontWeight.normal),
                                          color: isCurrent ? Colors.black87 : (isDone ? Colors.black87 : Colors.black38),
                                        ),
                                      ),
                                      Text(
                                        item['time'] as String,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                                          color: isCurrent ? const Color(0xFFCA8A04) : Colors.black38,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item['subtitle'] as String,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: (isDone || isCurrent) ? Colors.black54 : Colors.black26,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
            
            // Review Card when order is picked up
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 400),
              crossFadeState: _step >= 3 ? CrossFadeState.showFirst : CrossFadeState.showSecond,
              firstChild: Container(
                margin: const EdgeInsets.only(bottom: 20),
                child: Column(
                  children: [
                    // Digital Receipt Ready Card
                    Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF86EFAC)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: const BoxDecoration(
                                  color: Color(0xFF16A34A),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 22),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Reçu Numérique Disponible !',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF15803D)),
                                    ),
                                    Text(
                                      'Votre reçu certifié a été automatiquement transmis.',
                                      style: TextStyle(fontSize: 11, color: Color(0xFF166534)),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ReceiptScreen(
                                    orderId: widget.orderId,
                                    paymentMethod: widget.paymentMethod,
                                    pickupPin: _pin,
                                    items: widget.items,
                                    customTotal: widget.totalAmount,
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.visibility_rounded, size: 16, color: Colors.white),
                            label: const Text('Consulter mon Reçu Numérique', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF16A34A),
                              minimumSize: const Size(double.infinity, 42),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Review VIP banner
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                        boxShadow: [
                          BoxShadow(color: const Color(0xFFFACC15).withValues(alpha: 0.15), blurRadius: 10),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFFACC15),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.stars_rounded, color: Colors.black87, size: 24),
                              ),
                              const SizedBox(width: 14),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Vos produits vous ont plu ?',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                                    ),
                                    Text(
                                      'Donnez votre avis et gagnez +20 pts VIP 👑',
                                      style: TextStyle(fontSize: 12, color: Colors.black54),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          ElevatedButton.icon(
                            onPressed: () => ProductReviewSheet.show(context, orderId: widget.orderId),
                            icon: const Icon(Icons.rate_review, size: 18, color: Colors.black87),
                            label: const Text('Donner mon avis sur les produits', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black87, fontSize: 14)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFACC15),
                              minimumSize: const Size(double.infinity, 44),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 0,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              secondChild: const SizedBox.shrink(),
            ),

            // Interactive Demo Controls
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const SupportScreen()),
                      );
                    },
                    icon: const Icon(Icons.help_outline, color: Colors.black87),
                    label: const Text('Assistance', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Colors.black26),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        if (_step < _steps.length - 1) {
                          _step++;
                        } else {
                          _step = 0;
                        }
                      });
                    },
                    icon: const Icon(Icons.arrow_forward_rounded, color: Colors.black87),
                    label: const Text('Étape suivante', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFACC15),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
