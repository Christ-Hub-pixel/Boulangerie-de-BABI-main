import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class DigitalWalletScreen extends StatelessWidget {
  const DigitalWalletScreen({super.key});

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
        title: Text('Mon Portefeuille', style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Wallet Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [const Color(0xFF1F1F1F), const Color(0xFF422212)]),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Portefeuille BABI', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 14)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(8)),
                        child: Text('Actif', style: GoogleFonts.poppins(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text('15 000 FCFA', style: GoogleFonts.poppins(color: primaryColor, fontWeight: FontWeight.w900, fontSize: 32)),
                  const SizedBox(height: 10),
                  Text('ID: #WAL-2026-98', style: GoogleFonts.poppins(color: Colors.white38, fontSize: 12)),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Quick Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildActionButton(context, Icons.account_balance_wallet, 'Recharger'),
                _buildActionButton(context, Icons.payments, 'Payer'),
                _buildActionButton(context, Icons.swap_horiz, 'Transférer'),
                _buildActionButton(context, Icons.receipt, 'Relevé'),
              ],
            ),

            const SizedBox(height: 24),

            // Transactions History
            Align(
              alignment: Alignment.centerLeft,
              child: Text('Dernières transactions', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),

            _buildTransactionTile('Recharge Wave Mobile', '+ 10 000 FCFA', 'Aujourd\'hui 09:15', Colors.green),
            _buildTransactionTile('Achat Pain & Viennoiseries', '- 2 500 FCFA', 'Hier 17:40', Colors.red),
            _buildTransactionTile('Remboursement commande #981', '+ 1 500 FCFA', '22 Juil 2026', Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, IconData icon, String label) {
    return Column(
      children: [
        CircleAvatar(
          radius: 26,
          backgroundColor: Colors.white,
          child: Icon(icon, color: const Color(0xFFF4B400)),
        ),
        const SizedBox(height: 6),
        Text(label, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildTransactionTile(String title, String amount, String date, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
              Text(date, style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12)),
            ],
          ),
          Text(amount, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15, color: color)),
        ],
      ),
    );
  }
}
