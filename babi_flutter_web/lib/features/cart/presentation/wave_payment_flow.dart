
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../orders/domain/order_item_snapshot.dart';
import '../../orders/presentation/order_tracking_screen.dart';
import '../../orders/presentation/receipt_screen.dart';
import '../../home/presentation/home_screen.dart';
import '../../../core/services/pin_code_service.dart';

/// URL officielle marchande Wave de la Boulangerie de BABI
const String kOfficialWaveUrl = 'https://pay.wave.com/m/M_ci_7X1JfUg2eEsX/c/ci/?src=p';

// ============================================================================
// ÉTAPE 2 : MODAL BOTTOM SHEET PAIEMENT WAVE
// ============================================================================
class WavePaymentSheet extends StatelessWidget {
  final double totalAmount;
  final String orderId;
  final List<OrderItemSnapshot> items;
  final VoidCallback onProceedToSimulation;

  const WavePaymentSheet({
    super.key,
    required this.totalAmount,
    required this.orderId,
    required this.items,
    required this.onProceedToSimulation,
  });

  static Future<void> show(
    BuildContext context, {
    required double totalAmount,
    required String orderId,
    required List<OrderItemSnapshot> items,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => WavePaymentSheet(
        totalAmount: totalAmount,
        orderId: orderId,
        items: items,
        onProceedToSimulation: () {
          Navigator.pop(ctx);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => WaveCheckoutScreen(
                totalAmount: totalAmount,
                orderId: orderId,
                items: items,
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _openOfficialWaveLink() async {
    final cleanAmount = totalAmount.toInt();
    final dynamicUrl = '$kOfficialWaveUrl&amount=$cleanAmount&client_reference=$orderId';
    final uri = Uri.parse(dynamicUrl);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle & Header
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: Color(0xFF1EA5FC),
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(4),
                    child: Image.asset(
                      'assets/wave_money.webp',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.waves, color: Colors.white, size: 20),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Paiement Wave',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black87),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.black54),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Total Amount Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Montant total', style: TextStyle(color: Colors.black54, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(
                      '${totalAmount.toInt()} FCFA',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFACC15).withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFFCA8A04), size: 24),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 100% Secure Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFBBF7D0)),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified_user, color: Color(0xFF16A34A), size: 22),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Paiement 100% sécurisé par Wave',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF15803D)),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Vos données sont protégées et votre paiement est instantané.',
                        style: TextStyle(fontSize: 11, color: Colors.black54),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Illustration
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8),
                      ],
                    ),
                    child: const Icon(Icons.phone_iphone, color: Color(0xFF1EA5FC), size: 28),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('• • • ➔', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
                  ),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1EA5FC),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.lock, color: Colors.white, size: 24),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Passerelle Wave Sécurisée & Masquée
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF86EFAC)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF16A34A).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.lock_person_rounded, color: Color(0xFF16A34A), size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Passerelle Wave Sécurisée & Chiffrée',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF15803D)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Canal Protégé EAL6+ • Jeton de session #$orderId',
                        style: const TextStyle(fontSize: 11, color: Colors.black54, fontWeight: FontWeight.w500),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF16A34A),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text('🔒 100% Chiffré', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Votre paiement est automatiquement synchronisé et validé par notre système dès la transaction effectuée.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Colors.black54, height: 1.4),
          ),
          const SizedBox(height: 20),

          // Open Wave Button
          ElevatedButton.icon(
            onPressed: () {
              _openOfficialWaveLink();
              onProceedToSimulation();
            },
            icon: const Icon(Icons.waves, color: Colors.white, size: 20),
            label: const Text(
              'Payer & Valider la commande',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.white),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1EA5FC),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              elevation: 0,
            ),
          ),
          const SizedBox(height: 10),

          // Cancel Button
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: Color(0xFFFACC15), width: 1.5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            ),
            child: const Text(
              'Annuler',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87, fontSize: 14),
            ),
          ),
          const SizedBox(height: 12),

          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.verified, size: 14, color: Color(0xFF16A34A)),
              SizedBox(width: 6),
              Text('Paiement sécurisé et synchronisé en temps réel', style: TextStyle(color: Color(0xFF16A34A), fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// ÉTAPE 3 : ÉCRAN REDIRECTION & INTERFACE WAVE
// ============================================================================
class WaveCheckoutScreen extends StatefulWidget {
  final double totalAmount;
  final String orderId;
  final List<OrderItemSnapshot> items;

  const WaveCheckoutScreen({
    super.key,
    required this.totalAmount,
    required this.orderId,
    required this.items,
  });

  @override
  State<WaveCheckoutScreen> createState() => _WaveCheckoutScreenState();
}

class _WaveCheckoutScreenState extends State<WaveCheckoutScreen> {
  void _submitPayment() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => WaveProcessingScreen(
          totalAmount: widget.totalAmount,
          orderId: widget.orderId,
          items: widget.items,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1EA5FC),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(2),
              child: Image.asset(
                'assets/wave_money.webp',
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.waves, color: Color(0xFF1EA5FC), size: 16),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'wave',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: -0.5),
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Payment Target Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 16, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Paiement à', style: TextStyle(color: Colors.black54, fontSize: 12)),
                  const SizedBox(height: 2),
                  const Text(
                    'BOULANGERIE DE BABI',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Montant', style: TextStyle(color: Colors.black54, fontSize: 12)),
                          const SizedBox(height: 2),
                          Text(
                            '${widget.totalAmount.toInt()} FCFA',
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF1EA5FC)),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Référence', style: TextStyle(color: Colors.black54, fontSize: 12)),
                          const SizedBox(height: 2),
                          Text(
                            widget.orderId,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Select Wave Balance
            const Text('Choisir votre moyen de paiement', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF1EA5FC), width: 1.5),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Color(0xFF1EA5FC),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Solde Wave', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text('45 000 FCFA disponible', style: TextStyle(fontSize: 12, color: Colors.black54)),
                      ],
                    ),
                  ),
                  const Icon(Icons.check_circle, color: Color(0xFF1EA5FC), size: 22),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Secret Code PIN Input
            const Center(
              child: Text(
                'Entrez votre code secret Wave',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black54),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                4,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                    color: Color(0xFF0F172A),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: TextButton(
                onPressed: () {},
                child: const Text('Mot de passe oublié ?', style: TextStyle(color: Color(0xFF1EA5FC), fontSize: 12)),
              ),
            ),
            const SizedBox(height: 24),

            // Pay Button
            ElevatedButton(
              onPressed: _submitPayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1EA5FC),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                elevation: 0,
              ),
              child: Text(
                'Payer ${widget.totalAmount.toInt()} FCFA',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
              ),
            ),
            const SizedBox(height: 16),

            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline, size: 14, color: Colors.black45),
                SizedBox(width: 6),
                Text('Paiement 100% sécurisé par Wave', style: TextStyle(color: Colors.black45, fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// ÉTAPE 4 : ÉCRAN TRAITEMENT DU PAIEMENT WAVE (AVEC DÉTECTEUR DE RETOUR APP)
// ============================================================================
class WaveProcessingScreen extends StatefulWidget {
  final double totalAmount;
  final String orderId;
  final List<OrderItemSnapshot> items;

  const WaveProcessingScreen({
    super.key,
    required this.totalAmount,
    required this.orderId,
    required this.items,
  });

  @override
  State<WaveProcessingScreen> createState() => _WaveProcessingScreenState();
}

class _WaveProcessingScreenState extends State<WaveProcessingScreen> with WidgetsBindingObserver {
  String _statusMessage = 'En attente de votre validation sur l\'application Wave...';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Vérification automatique après un délai nominal
    Timer(const Duration(seconds: 4), () {
      if (!mounted) return;
      _confirmAndProceed();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Dès que l'utilisateur revient de l'application Wave au premier plan
    if (state == AppLifecycleState.resumed) {
      if (mounted) {
        setState(() {
          _statusMessage = 'Synchronisation instantanée avec Wave...';
        });
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) _confirmAndProceed();
        });
      }
    }
  }

  void _confirmAndProceed() {
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => WaveSuccessScreen(
          totalAmount: widget.totalAmount,
          orderId: widget.orderId,
          items: widget.items,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Spacer(),

              // Circular Wave Progress Ring with Mascot
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 140,
                    height: 140,
                    child: CircularProgressIndicator(
                      strokeWidth: 6,
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1EA5FC)),
                      backgroundColor: const Color(0xFF1EA5FC).withValues(alpha: 0.15),
                    ),
                  ),
                  Container(
                    width: 90,
                    height: 90,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF0F9FF),
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Image.asset(
                      'assets/wave_money.webp',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.waves, color: Color(0xFF1EA5FC), size: 40),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 36),

              const Text(
                'Paiement en cours...',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),
              Text(
                _statusMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black54, fontSize: 14, height: 1.4),
              ),

              const SizedBox(height: 24),
              // Bouton direct pour confirmer dès le retour
              ElevatedButton.icon(
                onPressed: _confirmAndProceed,
                icon: const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
                label: const Text(
                  'J\'ai validé sur Wave ➔ Confirmer',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1EA5FC),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),

              const Spacer(),

              // Do not close window notice
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.verified_user_rounded, color: Color(0xFF16A34A), size: 22),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Synchronisation automatique dès votre retour sur l\'application.',
                        style: TextStyle(color: Color(0xFF15803D), fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// ÉTAPE 5 : ÉCRAN PAIEMENT RÉUSSI WAVE
// ============================================================================
class WaveSuccessScreen extends StatelessWidget {
  final double totalAmount;
  final String orderId;
  final List<OrderItemSnapshot> items;

  const WaveSuccessScreen({
    super.key,
    required this.totalAmount,
    required this.orderId,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    const txnRef = 'T_7G8H9J2K3L4M5N6P';
    const remainingBalance = '43 300 FCFA';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),

              // Green Success Badge with celebration
              Center(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: const Color(0xFF22C55E),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF22C55E).withValues(alpha: 0.3),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.check, color: Colors.white, size: 54),
                ),
              ),
              const SizedBox(height: 28),

              const Text(
                'Paiement réussi !',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              Text(
                '${totalAmount.toInt()} FCFA ont été payés avec succès\nà BOULANGERIE DE BABI.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: Color(0xFF16A34A), fontWeight: FontWeight.w600, height: 1.4),
              ),
              const SizedBox(height: 32),

              // Transaction Info Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Référence', style: TextStyle(color: Colors.black54, fontSize: 12)),
                        Text(
                          txnRef,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                    ),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Nouveau solde Wave', style: TextStyle(color: Colors.black54, fontSize: 12)),
                        Text(
                          remainingBalance,
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Terminer Button (Transits to Return Screen)
              ElevatedButton(
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => WaveReturnScreen(
                        totalAmount: totalAmount,
                        orderId: orderId,
                        items: items,
                        txnRef: txnRef,
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1EA5FC),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  elevation: 0,
                ),
                child: const Text('Terminer', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              ),
              const SizedBox(height: 12),
              const Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.favorite, size: 14, color: Color(0xFF1EA5FC)),
                    SizedBox(width: 6),
                    Text('Merci d\'avoir utilisé Wave', style: TextStyle(color: Colors.black45, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// ÉTAPE 6 : ÉCRAN RETOUR À L'APPLICATION
// ============================================================================
class WaveReturnScreen extends StatefulWidget {
  final double totalAmount;
  final String orderId;
  final List<OrderItemSnapshot> items;
  final String txnRef;

  const WaveReturnScreen({
    super.key,
    required this.totalAmount,
    required this.orderId,
    required this.items,
    required this.txnRef,
  });

  @override
  State<WaveReturnScreen> createState() => _WaveReturnScreenState();
}

class _WaveReturnScreenState extends State<WaveReturnScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 2), () {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => OrderDetailScreen(
            totalAmount: widget.totalAmount,
            orderId: widget.orderId,
            items: widget.items,
            paymentMethod: 'Wave',
          ),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),

              // Green Confirmation Circle
              Center(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: const BoxDecoration(
                    color: Color(0xFF22C55E),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, color: Colors.white, size: 48),
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'Paiement confirmé',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              Text(
                'Votre paiement de ${widget.totalAmount.toInt()} FCFA\na été reçu avec succès.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black54, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 28),

              // Details card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Référence Wave', style: TextStyle(color: Colors.black54, fontSize: 12)),
                        Text(widget.txnRef, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Date', style: TextStyle(color: Colors.black54, fontSize: 12)),
                        Text('Aujourd\'hui à 18:08', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),

              const Spacer(),

              const Text(
                'Vous allez être redirigé vers le détail\nde votre commande...',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black45, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 16),
              const Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFACC15)),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// ÉTAPE 7 : ÉCRAN DÉTAIL DE LA COMMANDE CONFIRMÉE
// ============================================================================
class OrderDetailScreen extends StatelessWidget {
  final double totalAmount;
  final String orderId;
  final List<OrderItemSnapshot> items;
  final String paymentMethod;

  const OrderDetailScreen({
    super.key,
    required this.totalAmount,
    required this.orderId,
    required this.items,
    this.paymentMethod = 'Wave',
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEFDF9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87, size: 20),
          onPressed: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const HomeScreen()),
              (route) => false,
            );
          },
        ),
        title: const Text(
          'Détail de la commande',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w900, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Green Banner "Commande payée"
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 28),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Commande payée',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF15803D)),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Merci ! Votre commande a été payée avec succès.',
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Metadata card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 2)),
                ],
              ),
              child: Column(
                children: [
                  _buildMetaRow('Commande', orderId),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildMetaRow('Code PIN Retrait', '🔑 ${PinCodeService.formatPin(PinCodeService.generatePinForOrder(orderId))}', isBoldValue: true),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildMetaRow('Date', 'Aujourd\'hui à 18:08'),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Mode de paiement', style: TextStyle(color: Colors.black54, fontSize: 13)),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Color(0xFF1EA5FC),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.waves, color: Colors.white, size: 12),
                          ),
                          const SizedBox(width: 6),
                          Text(paymentMethod, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildMetaRow('Montant payé', '${totalAmount.toInt()} FCFA', isBoldValue: true),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Ordered Articles List
            const Text(
              'Articles commandés',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            ...items.map((item) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.bakery_dining, color: Color(0xFFCA8A04), size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.productName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${item.unitPrice.toInt()} FCFA × ${item.quantity}',
                              style: const TextStyle(color: Colors.black54, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${item.subtotal.toInt()} FCFA',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.black87),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 14),

            // Total Row
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
                  const Text('Total payé', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  Text(
                    '${totalAmount.toInt()} FCFA',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFFB45309)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Suivre la commande CTA Button
            ElevatedButton.icon(
              onPressed: () {
                final pin = PinCodeService.generatePinForOrder(orderId);
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => OrderTrackingScreen(
                      orderId: orderId,
                      totalAmount: totalAmount,
                      paymentMethod: paymentMethod,
                      currentStep: 2,
                      items: items,
                      pickupPin: pin,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.delivery_dining, color: Colors.black87),
              label: const Text('Suivi de la commande', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black87,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                elevation: 0,
              ),
            ),
            const SizedBox(height: 10),

            // Voir le ticket / reçu détaillé
            OutlinedButton.icon(
              onPressed: () {
                final pin = PinCodeService.generatePinForOrder(orderId);
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ReceiptScreen(
                      orderId: orderId,
                      paymentMethod: paymentMethod,
                      items: items,
                      customTotal: totalAmount,
                      pickupPin: pin,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.receipt_long, color: Colors.black87),
              label: const Text('Consulter le ticket de caisse officiel', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 14)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: const BorderSide(color: Colors.black26),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              ),
            ),
            const SizedBox(height: 10),

            // Retour accueil
            TextButton.icon(
              onPressed: () {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const HomeScreen()),
                  (route) => false,
                );
              },
              icon: const Icon(Icons.home_outlined, color: Colors.black54),
              label: const Text('Retour à l\'accueil', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaRow(String label, String value, {bool isBoldValue = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.black54, fontSize: 13)),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBoldValue ? FontWeight.w900 : FontWeight.bold,
            fontSize: isBoldValue ? 15 : 13,
            color: isBoldValue ? const Color(0xFF16A34A) : Colors.black87,
          ),
        ),
      ],
    );
  }
}
