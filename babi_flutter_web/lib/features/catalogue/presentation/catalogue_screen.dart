import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../cart/domain/cart_item.dart';
import '../../cart/providers/cart_provider.dart';
import '../../cart/presentation/cart_screen.dart';
import '../../../core/providers/product_provider.dart';
import '../../../core/widgets/custom_bottom_nav_bar.dart';
import 'product_detail_sheet.dart';

enum SortOption { defaultSort, priceAsc, priceDesc, nameAsc }

class CatalogueScreen extends ConsumerStatefulWidget {
  final String initialCategory;
  
  const CatalogueScreen({super.key, this.initialCategory = 'Tous'});

  @override
  ConsumerState<CatalogueScreen> createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends ConsumerState<CatalogueScreen> {
  late String selectedCategory;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  SortOption _currentSort = SortOption.defaultSort;
  bool _onlyPromos = false;

  @override
  void initState() {
    super.initState();
    selectedCategory = widget.initialCategory;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showSortDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Trier et Filtrer',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const Icon(Icons.sort),
                  title: const Text('Par défaut'),
                  trailing: _currentSort == SortOption.defaultSort ? const Icon(Icons.check, color: Color(0xFFFACC15)) : null,
                  onTap: () {
                    setState(() => _currentSort = SortOption.defaultSort);
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.arrow_upward),
                  title: const Text('Prix croissant'),
                  trailing: _currentSort == SortOption.priceAsc ? const Icon(Icons.check, color: Color(0xFFFACC15)) : null,
                  onTap: () {
                    setState(() => _currentSort = SortOption.priceAsc);
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.arrow_downward),
                  title: const Text('Prix décroissant'),
                  trailing: _currentSort == SortOption.priceDesc ? const Icon(Icons.check, color: Color(0xFFFACC15)) : null,
                  onTap: () {
                    setState(() => _currentSort = SortOption.priceDesc);
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.sort_by_alpha),
                  title: const Text('Nom (A à Z)'),
                  trailing: _currentSort == SortOption.nameAsc ? const Icon(Icons.check, color: Color(0xFFFACC15)) : null,
                  onTap: () {
                    setState(() => _currentSort = SortOption.nameAsc);
                    Navigator.pop(context);
                  },
                ),
                const Divider(),
                SwitchListTile(
                  title: const Text('Promotions uniquement', style: TextStyle(fontWeight: FontWeight.bold)),
                  value: _onlyPromos,
                  activeTrackColor: const Color(0xFFFACC15),
                  activeThumbColor: Colors.black87,
                  onChanged: (val) {
                    setState(() => _onlyPromos = val);
                    Navigator.pop(context);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalItemsCount = ref.watch(cartProvider).fold(0, (total, item) => total + item.quantity);
    final totalPrice = ref.read(cartProvider.notifier).totalPrice;

    final categories = ['Tous', 'Boulangerie', 'Viennoiseries', 'Gâteaux & Cakes', 'Desserts', 'Boissons'];
    
    final asyncProducts = ref.watch(productsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFEFDF9),
      extendBodyBehindAppBar: true,
      extendBody: true,
      body: Stack(
        children: [
          // Background Image
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Image.asset(
              'assets/fond arriere d ecran de catalogue.webp',
              fit: BoxFit.cover,
            ),
          ),
          
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                // AppBar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, size: 28),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      const Expanded(
                        child: Text(
                          'Catalogue',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ),
                      IconButton(
                        icon: Badge(
                          label: Text('$totalItemsCount'),
                          isLabelVisible: totalItemsCount > 0,
                          child: const Icon(Icons.shopping_cart_outlined, size: 28),
                        ),
                        onPressed: () {
                          Navigator.of(context).push(MaterialPageRoute(builder: (context) => const CartScreen()));
                        },
                      ),
                    ],
                  ),
                ),
                
                // Search Bar + Filter Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x0D000000),
                                blurRadius: 10,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: TextField(
                            controller: _searchController,
                            onChanged: (val) {
                              setState(() {
                                _searchQuery = val.trim().toLowerCase();
                              });
                            },
                            decoration: InputDecoration(
                              hintText: 'Rechercher un produit...',
                              prefixIcon: const Icon(Icons.search, color: Colors.black54),
                              suffixIcon: _searchQuery.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 18),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() => _searchQuery = '');
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      InkWell(
                        onTap: _showSortDialog,
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: (_currentSort != SortOption.defaultSort || _onlyPromos)
                                ? const Color(0xFFFACC15)
                                : Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x0D000000),
                                blurRadius: 10,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.tune, color: Colors.black87),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // Category Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: categories.map((cat) {
                      final isActive = cat == selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              selectedCategory = cat;
                            });
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            decoration: BoxDecoration(
                              color: isActive ? const Color(0xFFFACC15) : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x05000000),
                                  blurRadius: 4,
                                  offset: Offset(0, 2),
                                )
                              ],
                            ),
                            child: Text(
                              cat,
                              style: TextStyle(
                                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                                color: isActive ? Colors.black87 : Colors.black54,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Section Title & Counter
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.bakery_dining_outlined, color: Color(0xFFFACC15), size: 28),
                          const SizedBox(width: 8),
                          Text(
                            selectedCategory == 'Tous' ? 'Nos créations' : selectedCategory,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      if (_onlyPromos)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.red.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            '🔥 Promos',
                            style: TextStyle(fontSize: 11, color: Colors.red, fontWeight: FontWeight.bold),
                          ),
                        ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // Product Grid
                Expanded(
                  child: asyncProducts.when(
                    loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15))),
                    error: (e, st) => Center(child: Text('Erreur: $e')),
                    data: (productsList) {
                      var displayedProducts = selectedCategory == 'Tous' 
                          ? productsList 
                          : productsList.where((p) => p['category'] == selectedCategory).toList();
                      
                      // Search filter
                      if (_searchQuery.isNotEmpty) {
                        displayedProducts = displayedProducts.where((p) {
                          final name = (p['name'] as String).toLowerCase();
                          final cat = (p['category'] as String? ?? '').toLowerCase();
                          return name.contains(_searchQuery) || cat.contains(_searchQuery);
                        }).toList();
                      }

                      // Promo filter
                      if (_onlyPromos) {
                        displayedProducts = displayedProducts.where((p) => p['isPromo'] == true || (p['price'] as num) < 1500).toList();
                      }

                      // Sorting
                      if (_currentSort == SortOption.priceAsc) {
                        displayedProducts.sort((a, b) => (a['price'] as num).compareTo(b['price'] as num));
                      } else if (_currentSort == SortOption.priceDesc) {
                        displayedProducts.sort((a, b) => (b['price'] as num).compareTo(a['price'] as num));
                      } else if (_currentSort == SortOption.nameAsc) {
                        displayedProducts.sort((a, b) => (a['name'] as String).compareTo(b['name'] as String));
                      }
                      
                      if (displayedProducts.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.search_off_rounded, size: 64, color: Colors.grey.shade400),
                              const SizedBox(height: 12),
                              const Text('Aucun produit trouvé', style: TextStyle(fontSize: 16, color: Colors.black54, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 6),
                              const Text('Essayez avec d\'autres mots-clés ou filtres.', style: TextStyle(fontSize: 13, color: Colors.black38)),
                            ],
                          ),
                        );
                      }
                          
                      return GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          childAspectRatio: 0.55,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: displayedProducts.length,
                        itemBuilder: (context, index) {
                          final p = displayedProducts[index];
                          return _buildProductCard(
                            id: p['id'] as String,
                            name: p['name'] as String,
                            price: (p['price'] as num).toDouble(),
                            imagePath: p['image'] as String,
                            category: p['category'] as String? ?? 'Boulangerie',
                            description: p['description'] as String?,
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          
          // Floating Cart Banner with Smooth Entrance Animation
          Positioned(
            bottom: 120,
            left: 16,
            right: 16,
            child: AnimatedSlide(
              offset: totalItemsCount > 0 ? Offset.zero : const Offset(0, 2),
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutBack,
              child: AnimatedOpacity(
                opacity: totalItemsCount > 0 ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 300),
                child: totalItemsCount == 0
                    ? const SizedBox.shrink()
                    : InkWell(
                        onTap: () {
                          Navigator.of(context).push(MaterialPageRoute(builder: (context) => const CartScreen()));
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFACC15),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x33000000),
                                blurRadius: 10,
                                offset: Offset(0, 5),
                              )
                            ],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Flexible(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.shopping_bag_outlined, color: Colors.black87),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        'Voir le panier ($totalItemsCount)',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('|', style: TextStyle(color: Colors.black38, fontSize: 16)),
                                  const SizedBox(width: 6),
                                  Text('${totalPrice.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                  const SizedBox(width: 2),
                                  const Icon(Icons.chevron_right, color: Colors.black87),
                                ],
                              )
                            ],
                          ),
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: const CustomBottomNavBar(activeIndex: 1),
    );
  }

  Widget _buildProductCard({
    required String id,
    required String name,
    required double price,
    required String imagePath,
    String category = 'Boulangerie',
    String? description,
  }) {
    return InkWell(
      onTap: () {
        ProductDetailSheet.show(
          context,
          id: id,
          name: name,
          price: price,
          imagePath: imagePath,
          category: category,
          description: description,
        );
      },
      borderRadius: BorderRadius.circular(24),
      child: Container(
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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: Container(
                    height: 90,
                    width: double.infinity,
                    color: const Color(0xFFF9F9F9),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
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
                  top: 6,
                  right: 6,
                  child: CircleAvatar(
                    radius: 12,
                    backgroundColor: Colors.white,
                    child: Icon(Icons.favorite_border, size: 14, color: Color(0xFFFACC15)),
                  ),
                ),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: -0.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              '${price.toInt()} FCFA',
                              style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w900, fontSize: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        InkWell(
                          onTap: () {
                            ref.read(cartProvider.notifier).addItem(
                              CartItem(id: id, name: name, price: price, icon: Icons.bakery_dining, quantity: 1),
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('$name ajouté', style: const TextStyle(fontSize: 12)), duration: const Duration(seconds: 1)),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: Color(0xFFFACC15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.add, color: Colors.black87, size: 16),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
