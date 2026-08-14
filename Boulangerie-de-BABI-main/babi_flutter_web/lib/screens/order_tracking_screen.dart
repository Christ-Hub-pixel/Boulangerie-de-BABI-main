import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../main.dart';

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  int _currentStep = 2; // "Préparation en cours"

  final List<Map<String, dynamic>> _steps = [
    {'title': 'Commande reçue', 'completed': true, 'time': '10:30'},
    {'title': 'Préparation en cours', 'completed': true, 'time': '10:32'},
    {'title': 'Commande prête', 'completed': false, 'time': '--:--'},
    {'title': 'En livraison (Scooter)', 'completed': false, 'time': '--:--'},
    {'title': 'Commande livrée', 'completed': false, 'time': '--:--'},
  ];

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF4B400);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Color(0xFF1F1F1F)),
          onPressed: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const BabiHomeScreen()),
              (route) => false,
            );
          },
        ),
        title: Text(
          'Suivi de commande',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Success Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Colors.green.shade600, Colors.green.shade800]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 40),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Commande confirmée !', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Merci pour votre commande chez Boulangerie de Babi.', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Order Header Summary
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('N° Commande :', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey)),
                      Text('#BABI-2026-9842', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Paiement :', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey)),
                      Text('Wave (Payé)', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.green)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Arrivée estimée :', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey)),
                      Text('25 - 35 min', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: primaryColor)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Interactive Map Placeholder
            Container(
              height: 160,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFE5E7EB),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.map_rounded, size: 48, color: primaryColor),
                        const SizedBox(height: 6),
                        Text(
                          'Carte interactive en direct (GPS Livreur)',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1F1F1F)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Driver details card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 26,
                    backgroundColor: primaryColor,
                    child: Icon(Icons.person, color: Colors.white, size: 30),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Kouamé Ibrahim', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                        Text('Livreur Scooter • CI-8492-AB', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ),
                  IconButton(
                    style: IconButton.styleFrom(backgroundColor: primaryColor.withOpacity(0.15)),
                    icon: const Icon(Icons.phone, color: primaryColor),
                    onPressed: () {},
                  ),
                  IconButton(
                    style: IconButton.styleFrom(backgroundColor: primaryColor.withOpacity(0.15)),
                    icon: const Icon(Icons.chat_bubble_outline, color: primaryColor),
                    onPressed: () {},
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Tracking Timeline
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Évolution de la livraison', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 16),
                  Column(
                    children: _steps.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final step = entry.value;
                      final isCompleted = step['completed'] as bool;
                      final isCurrent = idx == _currentStep;

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            children: [
                              CircleAvatar(
                                radius: 10,
                                backgroundColor: isCompleted || isCurrent ? primaryColor : const Color(0xFFD1D5DB),
                                child: isCompleted
                                    ? const Icon(Icons.check, size: 12, color: Colors.white)
                                    : (isCurrent ? Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)) : null),
                              ),
                              if (idx < _steps.length - 1)
                                Container(
                                  width: 2,
                                  height: 32,
                                  color: isCompleted ? primaryColor : const Color(0xFFE5E7EB),
                                ),
                            ],
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  step['title'],
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: isCurrent || isCompleted ? FontWeight.bold : FontWeight.normal,
                                    color: isCurrent || isCompleted ? const Color(0xFF1F1F1F) : const Color(0xFF9CA3AF),
                                  ),
                                ),
                                const SizedBox(height: 20),
                              ],
                            ),
                          ),
                          Text(step['time'], style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey)),
                        ],
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.refresh, color: primaryColor),
                    label: Text('Recommander', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: primaryColor)),
                    onPressed: () {},
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.download),
                    label: Text('Facture', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    onPressed: () {},
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
