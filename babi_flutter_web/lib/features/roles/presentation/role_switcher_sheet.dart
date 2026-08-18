import 'package:flutter/material.dart';
import '../caissiere/presentation/cashier_dashboard_screen.dart';
import '../gerante/presentation/manager_dashboard_screen.dart';
import '../admin/presentation/admin_dashboard_screen.dart';
import '../../home/presentation/home_screen.dart';

enum UserAppRole {
  client,
  caissiere,
  gerante,
  admin,
}

class RoleSwitcherSheet extends StatelessWidget {
  final UserAppRole currentRole;

  const RoleSwitcherSheet({
    super.key,
    this.currentRole = UserAppRole.client,
  });

  static void show(BuildContext context, {UserAppRole currentRole = UserAppRole.client}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RoleSwitcherSheet(currentRole: currentRole),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 48,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.black12,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFACC15).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.swap_horiz_rounded, color: Color(0xFFCA8A04), size: 24),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Portails & Profils Métiers',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A)),
                    ),
                    Text(
                      'Basculez instantanément entre les 4 rôles',
                      style: TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // 1. Client Card
          _buildRoleCard(
            context,
            role: UserAppRole.client,
            title: 'Espace Client',
            subtitle: 'Choisir les produits, commander, payer Wave/Cash et retirer au comptoir',
            badge: 'Boutique',
            icon: Icons.person_rounded,
            color: const Color(0xFF3B82F6),
            isActive: currentRole == UserAppRole.client,
            onTap: () {
              Navigator.pop(context);
              if (currentRole != UserAppRole.client) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const HomeScreen()),
                  (route) => false,
                );
              }
            },
          ),
          const SizedBox(height: 12),

          // 2. Caissière Card
          _buildRoleCard(
            context,
            role: UserAppRole.caissiere,
            title: 'Espace Caissière',
            subtitle: 'Traiter les commandes, encaisser Wave/Espèces et valider le PIN de retrait',
            badge: 'Caisse & Comptoir',
            icon: Icons.point_of_sale_rounded,
            color: const Color(0xFF10B981),
            isActive: currentRole == UserAppRole.caissiere,
            onTap: () {
              Navigator.pop(context);
              if (currentRole != UserAppRole.caissiere) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const CashierDashboardScreen()),
                  (route) => false,
                );
              }
            },
          ),
          const SizedBox(height: 12),

          // 3. Gérante Card
          _buildRoleCard(
            context,
            role: UserAppRole.gerante,
            title: 'Espace Gérante',
            subtitle: 'Gérer produits, stocks, rapports des ventes et planning des employés',
            badge: 'Gestion Boutique',
            icon: Icons.storefront_rounded,
            color: const Color(0xFFF59E0B),
            isActive: currentRole == UserAppRole.gerante,
            onTap: () {
              Navigator.pop(context);
              if (currentRole != UserAppRole.gerante) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const ManagerDashboardScreen()),
                  (route) => false,
                );
              }
            },
          ),
          const SizedBox(height: 12),

          // 4. Administrateur Card
          _buildRoleCard(
            context,
            role: UserAppRole.admin,
            title: 'Espace Administrateur',
            subtitle: 'Supervision globale, gestion utilisateurs, boulangeries et commissions',
            badge: 'Super Admin',
            icon: Icons.admin_panel_settings_rounded,
            color: const Color(0xFF8B5CF6),
            isActive: currentRole == UserAppRole.admin,
            onTap: () {
              Navigator.pop(context);
              if (currentRole != UserAppRole.admin) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
                  (route) => false,
                );
              }
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildRoleCard(
    BuildContext context, {
    required UserAppRole role,
    required String title,
    required String subtitle,
    required String badge,
    required IconData icon,
    required Color color,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isActive ? color.withValues(alpha: 0.08) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? color : const Color(0xFFE2E8F0),
            width: isActive ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                          color: isActive ? color : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          badge,
                          style: TextStyle(
                            color: color,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 11, color: Colors.black54, height: 1.3),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              isActive ? Icons.check_circle_rounded : Icons.arrow_forward_ios_rounded,
              color: isActive ? color : Colors.black26,
              size: isActive ? 22 : 14,
            ),
          ],
        ),
      ),
    );
  }
}
