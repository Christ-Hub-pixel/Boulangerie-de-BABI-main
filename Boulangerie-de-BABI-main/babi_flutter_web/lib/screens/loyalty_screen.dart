import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LoyaltyScreen extends StatelessWidget {
  const LoyaltyScreen({super.key});

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
          'Programme de fidélité',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Loyalty Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [primaryColor, const Color(0xFFD97706)]),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: primaryColor.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Niveau Or 🥇', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                      const Icon(Icons.stars, color: Colors.white, size: 28),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text('450 Points', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 32)),
                  const SizedBox(height: 12),
                  LinearProgressIndicator(value: 0.9, backgroundColor: Colors.white30, color: Colors.white),
                  const SizedBox(height: 6),
                  Text('Plus que 50 points avant votre livraison gratuite !', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Text('Récompenses disponibles', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            _buildRewardCard('Croissant offert', 100, true),
            _buildRewardCard('Réduction de 10%', 300, true),
            _buildRewardCard('Livraison gratuite', 500, false),
          ],
        ),
      ),
    );
  }

  Widget _buildRewardCard(String title, int points, bool available) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.card_giftcard, color: Color(0xFFF4B400)),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                  Text('$points points requises', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ],
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: available ? const Color(0xFFF4B400) : Colors.grey.shade300,
            ),
            onPressed: available ? () {} : null,
            child: Text(available ? 'Échanger' : 'Verrouillé', style: TextStyle(color: available ? Colors.white : Colors.grey.shade600)),
          ),
        ],
      ),
    );
  }
}
