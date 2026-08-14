import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedFilter = 'Toutes';

  final List<Map<String, dynamic>> _notifications = [
    {
      'title': 'Commande en cours de livraison ! 🛵',
      'message': 'Votre livreur Kouamé est en route vers Cocody Riviera 2.',
      'date': 'Il y a 10 min',
      'isRead': false,
      'type': 'Commandes',
      'icon': Icons.two_wheeler_rounded,
      'color': Colors.orange,
    },
    {
      'title': 'PROMO 🥖 Pain chaud offert !',
      'message': 'Obtenez 1 baguette douce offerte pour toute commande > 2000 FCFA.',
      'date': 'Hier 16:30',
      'isRead': true,
      'type': 'Promotions',
      'icon': Icons.local_offer_rounded,
      'color': Color(0xFFF4B400),
    },
    {
      'title': 'Nouveau produit : Brioche Tressée 🥐',
      'message': 'Venez découvrir notre nouvelle brioche au beurre frais.',
      'date': '24 Juil',
      'isRead': true,
      'type': 'Nouveautés',
      'icon': Icons.new_releases_rounded,
      'color': Colors.purple,
    },
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
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1F1F1F), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Notifications',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          TextButton(
            onPressed: () => setState(() {
              for (var n in _notifications) {
                n['isRead'] = true;
              }
            }),
            child: Text('Tout lire', style: GoogleFonts.poppins(color: primaryColor, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Filters
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['Toutes', 'Commandes', 'Promotions', 'Nouveautés'].map((flt) {
                  final isSel = _selectedFilter == flt;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(flt),
                      selected: isSel,
                      selectedColor: primaryColor,
                      backgroundColor: Colors.white,
                      labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                      onSelected: (val) => setState(() => _selectedFilter = flt),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 16),

            // Notification Cards List
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _notifications.length,
              itemBuilder: (context, index) {
                final notif = _notifications[index];
                final isUnread = !(notif['isRead'] as bool);

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isUnread ? Colors.amber.shade50 : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: isUnread ? Border.all(color: primaryColor.withOpacity(0.4)) : null,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        backgroundColor: (notif['color'] as Color).withOpacity(0.15),
                        child: Icon(notif['icon'], color: notif['color']),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(notif['title'], style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text(notif['message'], style: GoogleFonts.poppins(color: const Color(0xFF4B5563), fontSize: 13)),
                            const SizedBox(height: 6),
                            Text(notif['date'], style: GoogleFonts.poppins(color: Colors.grey, fontSize: 11)),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
