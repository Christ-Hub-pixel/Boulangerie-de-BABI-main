import 'package:flutter/material.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/catalogue/presentation/catalogue_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/orders/presentation/order_tracking_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/profile/presentation/profile_sub_screens.dart';
import '../../features/loyalty/presentation/loyalty_screen.dart';
import '../../features/support/presentation/support_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/roles/caissiere/presentation/cashier_dashboard_screen.dart';
import '../../features/roles/gerante/presentation/manager_dashboard_screen.dart';
import '../../features/roles/admin/presentation/admin_dashboard_screen.dart';
import '../../features/events/presentation/event_cake_booking_screen.dart';

class CustomDrawer extends StatelessWidget {
  const CustomDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFFFEFDF9),
      child: Column(
        children: [
          // Drawer Header
          Container(
            padding: const EdgeInsets.only(top: 60, bottom: 20, left: 20, right: 20),
            decoration: const BoxDecoration(
              color: Color(0xFFFACC15),
              borderRadius: BorderRadius.only(
                bottomRight: Radius.circular(30),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    image: const DecorationImage(
                      image: AssetImage('assets/kouassi.webp'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Marc Kouassi',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      Text(
                        '+225 07 12 34 56 78',
                        style: TextStyle(
                          color: Colors.black54,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 10),
          
          // Menu Items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildDrawerItem(
                  icon: Icons.home_rounded,
                  title: 'Accueil',
                  onTap: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const HomeScreen()),
                      (route) => false,
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.grid_view_rounded,
                  title: 'Catalogue',
                  onTap: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const CatalogueScreen()),
                      (route) => false,
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.cake_rounded,
                  title: 'Gâteaux d\'Événements',
                  badge: 'Sur-mesure',
                  badgeColor: const Color(0xFF0F172A),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const EventCakeBookingScreen()),
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.receipt_long_rounded,
                  title: 'Mes Commandes',
                  onTap: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const OrdersScreen()),
                      (route) => false,
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.location_searching_rounded,
                  title: 'Suivi en direct',
                  badge: 'En cours',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const OrderTrackingScreen()),
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.card_giftcard_rounded,
                  title: 'Club Fidélité BABI',
                  badge: '450 pts',
                  badgeColor: const Color(0xFFEAB308),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoyaltyScreen()),
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.person_outline_rounded,
                  title: 'Mon Profil',
                  onTap: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const ProfileScreen()),
                      (route) => false,
                    );
                  },
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 6.0),
                  child: Divider(color: Colors.black12),
                ),
                // Section 3 Rôles Métiers
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 4.0),
                  child: Text(
                    'PORTAILS & GESTION',
                    style: TextStyle(color: Colors.black45, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1),
                  ),
                ),
                _buildDrawerItem(
                  icon: Icons.point_of_sale_rounded,
                  title: 'Espace Caissière',
                  badge: 'Caisse',
                  badgeColor: const Color(0xFF10B981),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const CashierDashboardScreen()),
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.storefront_rounded,
                  title: 'Espace Gérante',
                  badge: 'Stocks/Prix',
                  badgeColor: const Color(0xFFF59E0B),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ManagerDashboardScreen()),
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.admin_panel_settings_rounded,
                  title: 'Espace Administrateur',
                  badge: 'Admin',
                  badgeColor: const Color(0xFF8B5CF6),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
                    );
                  },
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 6.0),
                  child: Divider(color: Colors.black12),
                ),
                _buildDrawerItem(
                  icon: Icons.help_outline_rounded,
                  title: 'Support & FAQ',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SupportScreen()),
                    );
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.settings_outlined,
                  title: 'Paramètres',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SettingsScreen()),
                    );
                  },
                ),
              ],
            ),
          ),
          
          // Logout Button
          Container(
            padding: const EdgeInsets.all(20),
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
              icon: const Icon(Icons.logout),
              label: const Text('Se déconnecter', style: TextStyle(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFF3D6),
                foregroundColor: Colors.redAccent,
                elevation: 0,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    String? badge,
    Color? badgeColor,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.black87),
      title: Row(
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          if (badge != null) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: (badgeColor ?? const Color(0xFF22C55E)).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                badge,
                style: TextStyle(
                  color: badgeColor ?? const Color(0xFF15803D),
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ],
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      onTap: onTap,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(30),
      ),
      hoverColor: const Color(0xFFFFF9E6),
    );
  }
}
