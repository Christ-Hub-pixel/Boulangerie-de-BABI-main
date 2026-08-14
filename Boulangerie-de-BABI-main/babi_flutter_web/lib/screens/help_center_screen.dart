import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

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
        title: Text('Centre d\'aide', style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Comment pouvons-nous vous aider ?', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold)),
            Text('Trouvez rapidement une réponse à vos questions.', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey)),
            const SizedBox(height: 16),

            // Search Bar
            TextField(
              decoration: InputDecoration(
                hintText: 'Rechercher une question...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),

            const SizedBox(height: 20),

            // Quick Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildQuickAction(Icons.local_shipping, 'Suivi'),
                _buildQuickAction(Icons.payments, 'Paiement'),
                _buildQuickAction(Icons.delivery_dining, 'Livraison'),
                _buildQuickAction(Icons.person, 'Compte'),
              ],
            ),

            const SizedBox(height: 24),

            // FAQ Accordions
            Text('Foire Aux Questions (FAQ)', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            ExpansionTile(
              title: Text('Comment passer une commande ?', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600)),
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text('Parcourez nos produits, ajoutez-les à votre panier et validez en choisissant votre mode de livraison et paiement (Wave, Orange, MTN ou Espèces).'),
                ),
              ],
            ),
            ExpansionTile(
              title: Text('Quels sont les délais de livraison à Abidjan ?', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600)),
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text('Le délai moyen de livraison en scooter est de 20 à 45 minutes selon votre commune.'),
                ),
              ],
            ),
            ExpansionTile(
              title: Text('Quels moyens de paiement sont acceptés ?', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600)),
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text('Nous acceptons Wave, Orange Money, MTN MoMo, Moov Money et le paiement en espèces à la livraison.'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, String label) {
    return Column(
      children: [
        CircleAvatar(radius: 24, backgroundColor: Colors.white, child: Icon(icon, color: const Color(0xFFF4B400))),
        const SizedBox(height: 6),
        Text(label, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
