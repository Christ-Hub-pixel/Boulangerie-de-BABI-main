import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PaymentMethodsScreen extends StatelessWidget {
  const PaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF4B400);

    final methods = [
      {'name': 'Wave Mobile Money 🌊', 'default': true},
      {'name': 'Orange Money 🍊', 'default': false},
      {'name': 'MTN Mobile Money 🟡', 'default': false},
      {'name': 'Carte Bancaire (Visa/Mastercard) 💳', 'default': false},
    ];

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
          'Moyens de paiement',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: methods.length,
        itemBuilder: (context, index) {
          final m = methods[index];
          final isDef = m['default'] as bool;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(m['name'].toString(), style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                if (isDef)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: primaryColor.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                    child: Text('Par défaut', style: GoogleFonts.poppins(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 11)),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
