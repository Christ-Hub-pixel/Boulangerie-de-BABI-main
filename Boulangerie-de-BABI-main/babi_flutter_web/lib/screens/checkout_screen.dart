import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'order_tracking_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int _currentStep = 2; // Default on Payment step
  String _selectedDeliveryOption = 'delivery';
  String _selectedPaymentMethod = 'wave';
  bool _termsAccepted = false;
  final TextEditingController _noteController = TextEditingController();
  final TextEditingController _addressController = TextEditingController(text: 'Cocody Riviera 2, Abidjan');

  @override
  void dispose() {
    _noteController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _onConfirmPayment() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const OrderTrackingScreen()),
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
          'Paiement',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Steps Progress Bar
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: ['Adresse', 'Livraison', 'Paiement', 'Confirmation'].asMap().entries.map((entry) {
                  final idx = entry.key;
                  final label = entry.value;
                  final isDone = idx < _currentStep;
                  final isCurrent = idx == _currentStep;

                  return Column(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: isDone || isCurrent ? primaryColor : const Color(0xFFE5E7EB),
                        child: Text(
                          '${idx + 1}',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isDone || isCurrent ? Colors.white : const Color(0xFF6B7280),
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        label,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                          color: isCurrent ? primaryColor : const Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 16),

            // Adresse de livraison
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Adresse de livraison', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                      TextButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.my_location, size: 16, color: primaryColor),
                        label: Text('GPS', style: GoogleFonts.poppins(fontSize: 12, color: primaryColor, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _addressController,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.location_on_outlined, color: primaryColor),
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Mode de réception
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Mode de réception', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  RadioListTile(
                    activeColor: primaryColor,
                    value: 'delivery',
                    groupValue: _selectedDeliveryOption,
                    title: Text('Livraison à domicile (30-45 min)', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text('Tarif calculé selon la distance (dès 500 F)', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey)),
                    onChanged: (val) => setState(() => _selectedDeliveryOption = val.toString()),
                  ),
                  RadioListTile(
                    activeColor: primaryColor,
                    value: 'pickup',
                    groupValue: _selectedDeliveryOption,
                    title: Text('Retrait en boutique (15-20 min)', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text('Boulangerie de BABI Riviera 2', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey)),
                    onChanged: (val) => setState(() => _selectedDeliveryOption = val.toString()),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Mode de paiement
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Mode de paiement', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  _buildPaymentRadio('wave', 'Wave Mobile Money 🌊', 'Sans frais de retrait'),
                  _buildPaymentRadio('orange_money', 'Orange Money 🍊', 'Validez par code secret USSD'),
                  _buildPaymentRadio('mtn_money', 'MTN Mobile Money 🟡', 'Notification Push MoMo'),
                  _buildPaymentRadio('cash', 'Paiement à la livraison 💵', 'Préparez l\'appoint en espèces'),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Note pour la boulangerie
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: TextField(
                controller: _noteController,
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: 'Ajouter une note pour la boulangerie...',
                  hintStyle: GoogleFonts.poppins(fontSize: 13, color: Colors.grey),
                  border: InputBorder.none,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Consent Checkbox
            Row(
              children: [
                Checkbox(
                  value: _termsAccepted,
                  activeColor: primaryColor,
                  onChanged: (val) => setState(() => _termsAccepted = val ?? false),
                ),
                Expanded(
                  child: Text(
                    'J\'accepte les conditions générales de vente.',
                    style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF4B5563)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
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
                Text('Total', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12)),
                Text('1150 FCFA', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: primaryColor)),
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
              onPressed: _onConfirmPayment,
              child: Text('Confirmer et payer', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentRadio(String value, String title, String subtitle) {
    return RadioListTile(
      activeColor: const Color(0xFFF4B400),
      value: value,
      groupValue: _selectedPaymentMethod,
      title: Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey)),
      onChanged: (val) => setState(() => _selectedPaymentMethod = val.toString()),
    );
  }
}
