import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'settings_screen.dart';
import 'favorites_screen.dart';
import 'order_history_screen.dart';
import 'notifications_screen.dart';
import 'addresses_screen.dart';
import 'payment_methods_screen.dart';
import 'loyalty_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF4B400);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Text(
          'Mon Profil',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF1F1F1F)),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // User Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 36,
                        backgroundColor: primaryColor,
                        child: Icon(Icons.person, size: 40, color: Colors.white),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Kouassi Jean',
                                  style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F)),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: primaryColor.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    'Or 🥇',
                                    style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text('+225 07 04 38 92 01', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey)),
                            Text('jean.kouassi@email.ci', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildPointBadge('450 pts', 'Fidélité'),
                      _buildPointBadge('Jan 2026', 'Membre depuis'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Quick Stats Card
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatItem('18', 'Commandes'),
                  _buildStatItem('6', 'Favoris'),
                  _buildStatItem('4', 'Avis'),
                  _buildStatItem('2', 'Adresses'),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Menu Options List
            Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              child: Column(
                children: [
                  _buildMenuItem(context, Icons.person_outline, 'Informations personnelles', null),
                  _buildMenuItem(context, Icons.location_on_outlined, 'Mes adresses', const AddressesScreen()),
                  _buildMenuItem(context, Icons.credit_card_outlined, 'Moyens de paiement', const PaymentMethodsScreen()),
                  _buildMenuItem(context, Icons.receipt_long_outlined, 'Historique des commandes', const OrderHistoryScreen()),
                  _buildMenuItem(context, Icons.favorite_border, 'Mes favoris', const FavoritesScreen()),
                  _buildMenuItem(context, Icons.notifications_none_rounded, 'Notifications', const NotificationsScreen()),
                  _buildMenuItem(context, Icons.stars_outlined, 'Programme de fidélité', const LoyaltyScreen()),
                  _buildMenuItem(context, Icons.support_agent_outlined, 'Support client', null),
                  _buildMenuItem(context, Icons.info_outline, 'À propos', null),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Logout Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                icon: const Icon(Icons.logout),
                label: Text('Se déconnecter', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                onPressed: () {},
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildPointBadge(String main, String sub) {
    return Column(
      children: [
        Text(main, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFFF4B400))),
        Text(sub, style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey)),
      ],
    );
  }

  Widget _buildStatItem(String count, String label) {
    return Column(
      children: [
        Text(count, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F))),
        Text(label, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildMenuItem(BuildContext context, IconData icon, String title, Widget? targetScreen) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF1F1F1F), size: 22),
      title: Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
      onTap: () {
        if (targetScreen != null) {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => targetScreen));
        }
      },
    );
  }
}
