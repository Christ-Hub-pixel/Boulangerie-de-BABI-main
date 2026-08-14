import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ReferralScreen extends StatelessWidget {
  const ReferralScreen({super.key});

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
        title: Text('Parrainage', style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [primaryColor, const Color(0xFFD97706)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  const Icon(Icons.card_giftcard, size: 50, color: Colors.white),
                  const SizedBox(height: 10),
                  Text('Invitez vos proches 🎉', style: GoogleFonts.poppins(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text('Gagnez des récompenses à chaque nouveau client parrainé.', textAlign: TextAlign.center, style: GoogleFonts.poppins(color: Colors.white70, fontSize: 13)),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Code Display & Copy Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  Text('VOTRE CODE DE PARRAINAGE', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(color: const Color(0xFFFFFDF8), border: Border.all(color: primaryColor), borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('BABI-JEAN-2026', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F))),
                        IconButton(
                          icon: const Icon(Icons.copy, color: primaryColor),
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code copié !')));
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Rules
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Programme de Récompenses', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                  const Divider(height: 20),
                  _buildRule('1ère commande du filleul', '+100 points fidélité'),
                  _buildRule('5 filleuls actifs', 'Livraison gratuite'),
                  _buildRule('10 filleuls actifs', 'Réduction de 15%'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRule(String cond, String rew) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(cond, style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF4B5563))),
          Text(rew, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFFF4B400))),
        ],
      ),
    );
  }
}
