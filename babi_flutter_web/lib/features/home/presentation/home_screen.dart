import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../../cart/domain/cart_item.dart';
import '../../cart/providers/cart_provider.dart';
import '../../cart/presentation/cart_screen.dart';
import '../../catalogue/presentation/catalogue_screen.dart';
import '../../catalogue/presentation/product_detail_sheet.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../../core/providers/product_provider.dart';
import '../../../core/widgets/custom_bottom_nav_bar.dart';
import '../../../core/widgets/custom_drawer.dart';
import '../../roles/caissiere/presentation/cashier_dashboard_screen.dart';
import '../../roles/gerante/presentation/manager_dashboard_screen.dart';
import '../../roles/admin/presentation/admin_dashboard_screen.dart';
import '../../roles/presentation/role_switcher_sheet.dart';
import '../../events/presentation/event_cake_booking_screen.dart';
import 'widgets/live_oven_baking_widget.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Écouter le nombre d'articles dans le panier
    final totalItemsCount = ref.watch(cartProvider).fold(0, (total, item) => total + item.quantity);

    final asyncProducts = ref.watch(productsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFEFDF9), // Fond très clair, proche de la maquette
      extendBody: true,
      extendBodyBehindAppBar: true,
      drawer: const CustomDrawer(),
      body: Stack(
        children: [
          // Background Image (Top)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Image.asset(
              'assets/fond arriere d ecran d accueil .webp',
              fit: BoxFit.cover,
            ),
          ),
          
          // Main Content
          SafeArea(
            bottom: false, // On gère le bas avec la navigation bar
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 100), // Espace pour la BottomAppBar
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // --- HEADER ---
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Builder(
                          builder: (context) {
                            return IconButton(
                              icon: const Icon(Icons.menu, size: 28),
                              onPressed: () {
                                Scaffold.of(context).openDrawer();
                              },
                            );
                          }
                        ),
                        // Actions
                        Row(
                          children: [
                            IconButton(
                              icon: const Badge(
                                label: Text('2'),
                                child: Icon(Icons.notifications_none_outlined, size: 28),
                              ),
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (context) => const NotificationsScreen()),
                                );
                              },
                            ),
                            IconButton(
                              icon: Badge(
                                label: Text('$totalItemsCount'),
                                isLabelVisible: totalItemsCount > 0,
                                child: const Icon(Icons.shopping_cart_outlined, size: 28),
                              ),
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (context) => const CartScreen()),
                                );
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),

                  // --- SEARCH BAR ---
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x08000000),
                            blurRadius: 15,
                            offset: Offset(0, 4),
                          )
                        ],
                      ),
                      child: const TextField(
                        decoration: InputDecoration(
                          hintText: 'Rechercher un produit...',
                          hintStyle: TextStyle(color: Colors.black38),
                          border: InputBorder.none,
                          prefixIcon: Padding(
                            padding: EdgeInsets.only(left: 16.0, right: 8.0),
                            child: Icon(Icons.search, color: Colors.black54),
                          ),
                          contentPadding: EdgeInsets.symmetric(vertical: 18),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // --- LIVE OVEN BAKING COUNTDOWN BANNER ---
                  const LiveOvenBakingWidget(),
                  const SizedBox(height: 16),

                  // --- HERO BANNER CAROUSEL ---
                  const HeroBannerCarousel(),
                  const SizedBox(height: 20),

                  // --- 3 BOUTONS ACCÈS DIRECT AUX RÔLES MÉTIERS ---
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: const [
                          BoxShadow(color: Color(0x15000000), blurRadius: 10, offset: Offset(0, 4)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.workspace_premium_rounded, color: Color(0xFFFACC15), size: 18),
                                  SizedBox(width: 8),
                                  Text(
                                    'ESPACES MÉTIERS & BOUTIQUE',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1),
                                  ),
                                ],
                              ),
                              InkWell(
                                onTap: () => RoleSwitcherSheet.show(context),
                                child: const Text(
                                  'Sélecteur ➔',
                                  style: TextStyle(color: Color(0xFFFACC15), fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              // 1. Bouton Caissière
                              Expanded(
                                child: InkWell(
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const CashierDashboardScreen()),
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1E293B),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
                                    ),
                                    child: const Column(
                                      children: [
                                        Icon(Icons.point_of_sale_rounded, color: Color(0xFF34D399), size: 22),
                                        SizedBox(height: 6),
                                        Text(
                                          'Caissière',
                                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                        ),
                                        Text(
                                          'Caisse & PIN',
                                          style: TextStyle(color: Colors.white54, fontSize: 9),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // 2. Bouton Gérante
                              Expanded(
                                child: InkWell(
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const ManagerDashboardScreen()),
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1E293B),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
                                    ),
                                    child: const Column(
                                      children: [
                                        Icon(Icons.storefront_rounded, color: Color(0xFFFBBF24), size: 22),
                                        SizedBox(height: 6),
                                        Text(
                                          'Gérante',
                                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                        ),
                                        Text(
                                          'Stocks & Prix',
                                          style: TextStyle(color: Colors.white54, fontSize: 9),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // 3. Bouton Admin
                              Expanded(
                                child: InkWell(
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1E293B),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: const Color(0xFF8B5CF6).withValues(alpha: 0.4)),
                                    ),
                                    child: const Column(
                                      children: [
                                        Icon(Icons.admin_panel_settings_rounded, color: Color(0xFFA78BFA), size: 22),
                                        SizedBox(height: 6),
                                        Text(
                                          'Admin',
                                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                        ),
                                        Text(
                                          'Supervision',
                                          style: TextStyle(color: Colors.white54, fontSize: 9),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // --- BANNIÈRE GÂTEAUX D'ÉVÉNEMENTS SUR-MESURE ---
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const EventCakeBookingScreen()),
                        );
                      },
                      borderRadius: BorderRadius.circular(24),
                      child: Container(
                        height: 140,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: const [
                            BoxShadow(color: Color(0x14000000), blurRadius: 18, offset: Offset(0, 6)),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.asset(
                                'assets/gateau evenement.webp',
                                fit: BoxFit.cover,
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                    colors: [
                                      const Color(0xFF0F172A).withValues(alpha: 0.92),
                                      const Color(0xFF0F172A).withValues(alpha: 0.4),
                                    ],
                                  ),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Row(
                                  children: [
                                    Expanded(
                                      flex: 3,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFACC15),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: const Text('SUR-MESURE & ÉVÉNEMENTS', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 0.5)),
                                          ),
                                          const SizedBox(height: 6),
                                          const Text(
                                            'Gâteaux d\'Anniversaire & Mariage',
                                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15),
                                          ),
                                          const SizedBox(height: 2),
                                          const Text(
                                            'Créez votre pièce d\'exception ➔',
                                            style: TextStyle(color: Color(0xFFFDE68A), fontSize: 12, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFACC15),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: const Icon(Icons.cake_rounded, color: Color(0xFF0F172A), size: 26),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // --- CATEGORIES ---
                  _buildSectionHeader(context, 'Catégories', 'Voir tout >', 'Tous'),
                  const SizedBox(height: 16),
                  ContinuousAutoScroller(
                    itemWidth: 126,
                    children: [
                      _buildCategoryCard(context, 'Pains', Icons.bakery_dining),
                      _buildCategoryCard(context, 'Viennoiseries', Icons.breakfast_dining),
                      _buildCategoryCard(context, 'Pâtisseries', Icons.cake),
                      _buildCategoryCard(context, 'Boissons', Icons.local_cafe),
                      _buildCategoryCard(context, 'Salés', Icons.fastfood),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // --- POPULAR PRODUCTS ---
                  _buildSectionHeader(context, 'Nos produits populaires', 'Voir tout >', 'Tous'),
                  const SizedBox(height: 16),
                  asyncProducts.when(
                    loading: () => const SizedBox(height: 150, child: Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))),
                    error: (e, st) => const SizedBox(height: 150, child: Center(child: Text('Erreur'))),
                    data: (products) {
                      final popularProducts = products.take(5).toList();
                      return ContinuousAutoScroller(
                        itemWidth: 176,
                        children: popularProducts.map((p) => _buildProductCard(
                          context: context,
                          ref: ref,
                          id: p['id'].toString(),
                          name: p['name'] as String,
                          price: p['price'] as double,
                          imagePath: p['image'] as String,
                        )).toList(),
                      );
                    },
                  ),
                  const SizedBox(height: 32),

                  // Removed Delivery Banner
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: const CustomBottomNavBar(activeIndex: 0),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, String action, String targetCategory) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          InkWell(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => CatalogueScreen(initialCategory: targetCategory),
                ),
              );
            },
            child: Row(
              children: [
                Text(
                  action,
                  style: const TextStyle(color: Colors.black54, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(BuildContext context, String title, IconData icon) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => CatalogueScreen(initialCategory: title),
          ),
        );
      },
      child: Container(
      margin: const EdgeInsets.only(right: 16),
      width: 110,
      height: 110,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: const Color(0xFFFACC15), size: 36),
          const SizedBox(height: 12),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              title,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    ));
  }

  Widget _buildProductCard({
    required BuildContext context,
    required WidgetRef ref,
    required String id,
    required String name,
    required double price,
    double? oldPrice,
    required String imagePath,
  }) {
    return GestureDetector(
      onTap: () {
        ProductDetailSheet.show(
          context,
          id: id,
          name: name,
          price: price,
          imagePath: imagePath,
          category: 'Boulangerie',
        );
      },
      child: Container(
        margin: const EdgeInsets.only(right: 16, bottom: 8),
        width: 160,
        decoration: BoxDecoration(
          color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: Container(
                  height: 140, // Plus grand pour effet magazine
                  width: double.infinity,
                  color: const Color(0xFFF9F9F9), // Fond léger pour détacher l'image
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Image.asset(
                      imagePath,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Center(
                        child: Icon(Icons.image_not_supported, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
              ),
              const Positioned(
                top: 8,
                right: 8,
                child: CircleAvatar(
                  radius: 14,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.favorite_border, size: 16, color: Color(0xFFFACC15)),
                ),
              ),
              if (oldPrice != null)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.redAccent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'PROMO',
                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: -0.3),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (oldPrice != null)
                              Text(
                                '${oldPrice.toInt()} FCFA',
                              style: const TextStyle(color: Color(0xFFFACC15), fontSize: 10, decoration: TextDecoration.lineThrough),
                            ),
                          Text(
                            '${price.toInt()} FCFA',
                            style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w900, fontSize: 15),
                          ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    InkWell(
                      onTap: () {
                        // Ajouter au panier
                        ref.read(cartProvider.notifier).addItem(
                          CartItem(id: id, name: name, price: price, icon: Icons.bakery_dining, quantity: 1),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('$name ajouté au panier')),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Color(0xFFFACC15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.add, color: Colors.black87, size: 20),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      ),
    );
  }

}

class HeroBannerCarousel extends StatefulWidget {
  const HeroBannerCarousel({super.key});

  @override
  State<HeroBannerCarousel> createState() => _HeroBannerCarouselState();
}

class _HeroBannerCarouselState extends State<HeroBannerCarousel> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  
  final List<Map<String, dynamic>> _banners = [
    {
      'title1': 'Du bon pain,\n',
      'title2': 'fait avec amour',
      'subtitle': 'Pains frais, viennoiseries\net pâtisseries chaque jour.',
      'buttonText': 'Découvrir',
      'image': 'assets/carousel_viennoiseries.webp',
      'color': const Color(0xFFFFF3D6),
      'hasHeart': true,
    },
    {
      'title1': 'Des pâtisseries,\n',
      'title2': 'divines',
      'subtitle': 'Gâteaux sur commande et\ndouceurs pour vos événements.',
      'buttonText': 'Commander',
      'image': 'assets/carousel_gateaux.webp',
      'color': const Color(0xFFFDEBFF),
      'hasHeart': false,
    },
    {
      'title1': 'Commandez,\n',
      'title2': 'et récupérez',
      'subtitle': 'Retirez vos commandes\nen boutique sans attendre.',
      'buttonText': 'Voir plus',
      'image': 'assets/carousel_pastries.webp',
      'color': const Color(0xFFE8FAFF),
      'hasHeart': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    _startAutoScroll();
  }
  
  void _startAutoScroll() {
    Future.delayed(const Duration(seconds: 5), () {
      if (!mounted) return;
      int nextIndex = (_currentIndex + 1) % _banners.length;
      _pageController.animateToPage(
        nextIndex,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
      _startAutoScroll();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Widget _buildDot(int index) {
    bool active = _currentIndex == index;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      width: active ? 24 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: active ? const Color(0xFFFACC15) : Colors.black12,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 260,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            itemCount: _banners.length,
            itemBuilder: (context, index) {
              final banner = _banners[index];
              final hasHeart = banner['hasHeart'] as bool? ?? false;
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16.0),
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                decoration: BoxDecoration(
                  color: banner['color'] as Color,
                  borderRadius: BorderRadius.circular(32),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 5,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            banner['title1'] as String,
                            style: const TextStyle(fontSize: 18, color: Colors.black87),
                          ),
                          Row(
                            children: [
                              Flexible(
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    banner['title2'] as String,
                                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.black87),
                                  ),
                                ),
                              ),
                              if (hasHeart) ...[
                                const SizedBox(width: 8),
                                const Icon(Icons.favorite_border, color: Color(0xFFFACC15), size: 24),
                              ],
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            banner['subtitle'] as String,
                            style: const TextStyle(fontSize: 13, height: 1.4, color: Colors.black54),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Spacer(),
                          ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFACC15),
                              foregroundColor: Colors.black87,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            ),
                            child: Text(banner['buttonText'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 4,
                      child: Image.asset(
                        banner['image'] as String,
                        height: 160,
                        fit: BoxFit.contain,
                        alignment: Alignment.centerRight,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.bakery_dining, size: 80, color: Colors.orangeAccent),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_banners.length, (index) => _buildDot(index)),
        ),
      ],
    );
  }
}

class ContinuousAutoScroller extends StatefulWidget {
  final List<Widget> children;
  final double itemWidth;
  
  const ContinuousAutoScroller({super.key, required this.children, required this.itemWidth});
  
  @override
  State<ContinuousAutoScroller> createState() => _ContinuousAutoScrollerState();
}

class _ContinuousAutoScrollerState extends State<ContinuousAutoScroller> {
  final ScrollController _scrollController = ScrollController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startScrolling();
  }

  void _startScrolling() {
    _timer = Timer.periodic(const Duration(seconds: 15), (timer) {
      if (!mounted) return;
      if (_scrollController.hasClients) {
        double maxScroll = _scrollController.position.maxScrollExtent;
        double currentScroll = _scrollController.offset;
        double nextScroll = currentScroll + widget.itemWidth;
        
        if (nextScroll > maxScroll) {
          nextScroll = 0; // Retour au début
        }
        
        _scrollController.animateTo(
          nextScroll,
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _timer?.cancel(),
      onPointerUp: (_) => _startScrolling(),
      child: SingleChildScrollView(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Row(
          children: widget.children,
        ),
      ),
    );
  }
}

