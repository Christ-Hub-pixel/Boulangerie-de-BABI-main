import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/cart/providers/cart_provider.dart';
import '../../features/cart/presentation/cart_screen.dart';


import '../../features/home/presentation/home_screen.dart';
import '../../features/catalogue/presentation/catalogue_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';

class CustomBottomNavBar extends ConsumerWidget {
  final int activeIndex;

  const CustomBottomNavBar({super.key, required this.activeIndex});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalItemsCount = ref.watch(cartProvider).fold(0, (total, item) => total + item.quantity);

    return Container(
      height: 90, // Hauteur totale incluant le débordement
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
      child: Stack(
        alignment: Alignment.bottomCenter,
        clipBehavior: Clip.none,
        children: [
          // The main white pill
          Container(
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(30),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x1A000000),
                  blurRadius: 20,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: _buildNavItem(
                    context: context,
                    icon: Icons.home_rounded,
                    label: 'Accueil',
                    isActive: activeIndex == 0,
                    index: 0,
                  ),
                ),
                Expanded(
                  child: _buildNavItem(
                    context: context,
                    icon: Icons.grid_view_rounded,
                    label: 'Catalogue',
                    isActive: activeIndex == 1,
                    index: 1,
                  ),
                ),
                const SizedBox(width: 80), // Space for the center button
                Expanded(
                  child: _buildNavItem(
                    context: context,
                    icon: Icons.receipt_long_rounded,
                    label: 'Commandes',
                    isActive: activeIndex == 3,
                    index: 3,
                  ),
                ),
                Expanded(
                  child: _buildNavItem(
                    context: context,
                    icon: Icons.person_outline_rounded,
                    label: 'Profil',
                    isActive: activeIndex == 4,
                    index: 4,
                  ),
                ),
              ],
            ),
          ),
          
          // The white bump
          Positioned(
            bottom: 8,
            child: Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
          ),

          // The yellow central button
          Positioned(
            bottom: 14,
            child: GestureDetector(
              onTap: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CartScreen()));
              },
              child: Container(
                width: 60,
                height: 60,
                decoration: const BoxDecoration(
                  color: Color(0xFFFACC15),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x4DFACC15),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Center(
                  child: Badge(
                    label: Text(
                      totalItemsCount.toString(),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                    isLabelVisible: totalItemsCount > 0,
                    backgroundColor: Colors.red,
                    offset: const Offset(8, -8),
                    child: const Icon(
                      Icons.shopping_bag_rounded,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    required bool isActive,
    required int index,
  }) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (isActive) return;
        if (index == 0) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const HomeScreen()),
            (route) => false,
          );
        } else if (index == 1) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const CatalogueScreen()),
            (route) => false,
          );
        } else if (index == 3) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const OrdersScreen()),
            (route) => false,
          );
        } else if (index == 4) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const ProfileScreen()),
            (route) => false,
          );
        }
      },
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFFFFF9E6) : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isActive ? const Color(0xFFFACC15) : Colors.black54,
                size: 24,
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 9, // Reduced font size to fit
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                  color: isActive ? const Color(0xFFFACC15) : Colors.black54,
                ),
                maxLines: 1,
                overflow: TextOverflow.visible,
              ),
              if (isActive)
                Container(
                  margin: const EdgeInsets.only(top: 2),
                  width: 4,
                  height: 4,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFACC15),
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
