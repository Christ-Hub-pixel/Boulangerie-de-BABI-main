import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/custom_bottom_nav_bar.dart';
import '../../auth/presentation/login_screen.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../orders/presentation/orders_screen.dart';
import '../../orders/presentation/order_tracking_screen.dart';
import '../../loyalty/presentation/loyalty_screen.dart';
import '../../support/presentation/support_screen.dart';
import 'profile_sub_screens.dart';
import '../../roles/presentation/role_switcher_sheet.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFFEFDF9),
        image: DecorationImage(
          image: AssetImage('assets/fond arriere d ecran de commande.webp'),
          fit: BoxFit.cover,
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Column(
            children: [
              // 1. Custom AppBar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      height: 48,
                      width: 48,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        image: DecorationImage(
                          image: AssetImage('assets/logo.webp'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const Text(
                      'Mon profil',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Badge(
                            label: Text('2'),
                            child: Icon(Icons.notifications_none_outlined, size: 26),
                          ),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const NotificationsScreen()),
                            );
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.headset_mic_outlined, size: 26),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const SupportScreen()),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 2. Body
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 12),
                      
                      // Identity Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: const [
                            BoxShadow(color: Color(0x05000000), blurRadius: 15, offset: Offset(0, 4)),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFFFACC15), width: 2),
                                image: const DecorationImage(
                                  image: AssetImage('assets/kouassi.webp'),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Marc Kouassi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                  SizedBox(height: 2),
                                  Text('+225 07 12 34 56 78', style: TextStyle(fontSize: 12, color: Colors.black54)),
                                  SizedBox(height: 2),
                                  Text('marc.kouassi@email.com', style: TextStyle(fontSize: 12, color: Colors.black54)),
                                ],
                              ),
                            ),
                            InkWell(
                              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EditProfileScreen())),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  border: Border.all(color: const Color(0xFFFACC15)),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.edit_outlined, size: 14, color: Color(0xFFCA8A04)),
                                    SizedBox(width: 4),
                                    Text('Éditer', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                                  ],
                                ),
                              ),
                            )
                          ],
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Loyalty VIP Banner
                      InkWell(
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoyaltyScreen())),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF1E1E1E), Color(0xFF2C2C2C)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: const [
                              BoxShadow(color: Color(0x15000000), blurRadius: 10, offset: Offset(0, 4)),
                            ],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: Color(0xFFFACC15),
                                    radius: 20,
                                    child: Icon(Icons.star, color: Colors.black87, size: 20),
                                  ),
                                  SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'BABI Club Fidélité',
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                      SizedBox(height: 2),
                                      Text(
                                        '450 pts disponibles • Niveau VIP',
                                        style: TextStyle(color: Color(0xFFFACC15), fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const Row(
                                children: [
                                  Text('Voir', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                                  SizedBox(width: 2),
                                  Icon(Icons.arrow_forward_ios, size: 12, color: Colors.white70),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Stats Row
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: const [
                            BoxShadow(color: Color(0x05000000), blurRadius: 15, offset: Offset(0, 4)),
                          ],
                        ),
                        child: IntrinsicHeight(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              _buildStatColumn(context, Icons.shopping_bag_outlined, 'Commandes', '12', 'Mes achats', const OrdersScreen()),
                              const VerticalDivider(width: 1, color: Colors.black12),
                              _buildStatColumn(context, Icons.location_searching_rounded, 'Suivi', '1', 'En cours', const OrderTrackingScreen()),
                              const VerticalDivider(width: 1, color: Colors.black12),
                              _buildStatColumn(context, Icons.location_on_outlined, 'Adresses', '2', 'Livraison', const AddressesScreen()),
                              const VerticalDivider(width: 1, color: Colors.black12),
                              _buildStatColumn(context, Icons.account_balance_wallet_outlined, 'Paiements', 'Wave/OM', 'Moyens', const PaymentsScreen()),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Mon compte Section
                      const Row(
                        children: [
                          Icon(Icons.person_outline, color: Color(0xFFCA8A04)),
                          SizedBox(width: 8),
                          Text('Mon compte', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: const [
                            BoxShadow(color: Color(0x05000000), blurRadius: 15, offset: Offset(0, 4)),
                          ],
                        ),
                        child: Column(
                          children: [
                            _buildListTile(context, Icons.person_outline, 'Informations personnelles', const EditProfileScreen()),
                            _buildDivider(),
                            _buildListTile(context, Icons.card_giftcard_outlined, 'Mes récompenses & points', const LoyaltyScreen()),
                            _buildDivider(),
                            _buildListTile(context, Icons.location_on_outlined, 'Mes adresses de livraison', const AddressesScreen()),
                            _buildDivider(),
                            _buildListTile(context, Icons.payment_outlined, 'Mes moyens de paiement (Wave, OM, MTN)', const PaymentsScreen()),
                            _buildDivider(),
                            _buildListTile(context, Icons.notifications_none_outlined, 'Notifications & alertes', const NotificationsScreen()),
                            _buildDivider(),
                            _buildListTile(context, Icons.settings_outlined, 'Paramètres & sécurité', const SettingsScreen()),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Aide et support Section
                      const Row(
                        children: [
                          Icon(Icons.headset_mic_outlined, color: Color(0xFFCA8A04)),
                          SizedBox(width: 8),
                          Text('Aide & Support client', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: const [
                            BoxShadow(color: Color(0x05000000), blurRadius: 15, offset: Offset(0, 4)),
                          ],
                        ),
                        child: Column(
                          children: [
                            _buildListTile(context, Icons.support_agent_rounded, 'Service client & WhatsApp BABI', const SupportScreen()),
                            _buildDivider(),
                            _buildListTile(context, Icons.rate_review_outlined, 'Déposer une réclamation', const SupportScreen()),
                            _buildDivider(),
                            _buildListTile(context, Icons.help_outline, 'Foire Aux Questions (FAQ)', const SupportScreen()),
                            _buildDivider(),
                            _buildListTile(context, Icons.info_outline, 'À propos de la Boulangerie de BABI', const AboutScreen()),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Portails Métiers CTA Card
                      InkWell(
                        onTap: () => RoleSwitcherSheet.show(context),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: const [
                              BoxShadow(color: Color(0x15000000), blurRadius: 10, offset: Offset(0, 4)),
                            ],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFACC15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.swap_horiz_rounded, color: Colors.black87, size: 22),
                                  ),
                                  const SizedBox(width: 14),
                                  const Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Portails Métiers (4 Rôles)',
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                      SizedBox(height: 2),
                                      Text(
                                        'Caissière • Gérante • Admin',
                                        style: TextStyle(color: Colors.white60, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFFFACC15), size: 14),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Logout Button
                      ElevatedButton.icon(
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
                          minimumSize: const Size(double.infinity, 52),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),

                      const SizedBox(height: 120),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: const CustomBottomNavBar(activeIndex: 4),
      ),
    );
  }

  Widget _buildStatColumn(BuildContext context, IconData icon, String title, String count, String subtitle, Widget targetScreen) {
    return Expanded(
      child: InkWell(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => targetScreen)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4.0),
          child: Column(
            children: [
              Icon(icon, color: const Color(0xFFCA8A04), size: 20),
              const SizedBox(height: 4),
              Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(count, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
              const SizedBox(height: 2),
              Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(fontSize: 9, color: Colors.black54)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildListTile(BuildContext context, IconData icon, String title, Widget targetScreen) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFFCA8A04), size: 22),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.black45),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
      visualDensity: VisualDensity.compact,
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => targetScreen)),
    );
  }

  Widget _buildDivider() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.0),
      child: Divider(height: 1, color: Colors.black12),
    );
  }
}
