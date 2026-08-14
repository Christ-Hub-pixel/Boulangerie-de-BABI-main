import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CategoriesScreen extends StatelessWidget {
  const CategoriesScreen({super.key});

  final List<Map<String, dynamic>> _categories = const [
    {
      'id': 'pain',
      'title': 'Pain',
      'icon': Icons.bakery_dining_rounded,
      'image': 'assets/categories/pain.png',
      'color': Color(0xFFF4B400),
      'count': 24
    },
    {
      'id': 'viennoiseries',
      'title': 'Viennoiseries',
      'icon': Icons.cookie_outlined,
      'image': 'assets/categories/viennoiserie.png',
      'color': Color(0xFFD97706),
      'count': 18
    },
    {
      'id': 'patisseries',
      'title': 'Pâtisseries',
      'icon': Icons.cake_outlined,
      'image': 'assets/categories/patisserie.png',
      'color': Color(0xFFEC4899),
      'count': 36
    },
    {
      'id': 'sandwichs',
      'title': 'Sandwichs',
      'icon': Icons.lunch_dining_rounded,
      'image': 'assets/categories/sandwich.png',
      'color': Color(0xFF10B981),
      'count': 15
    },
    {
      'id': 'pizzas',
      'title': 'Pizzas',
      'icon': Icons.local_pizza_outlined,
      'image': 'assets/categories/pizza.png',
      'color': Color(0xFFEF4444),
      'count': 12
    },
    {
      'id': 'glaces',
      'title': 'Glaces',
      'icon': Icons.icecream_outlined,
      'image': 'assets/categories/glace.png',
      'color': Color(0xFF3B82F6),
      'count': 14
    },
    {
      'id': 'boissons',
      'title': 'Boissons',
      'icon': Icons.local_drink_outlined,
      'image': 'assets/categories/boisson.png',
      'color': Color(0xFF06B6D4),
      'count': 40
    },
    {
      'id': 'promotions',
      'title': 'Promotions',
      'icon': Icons.local_offer_outlined,
      'image': 'assets/categories/promo.png',
      'color': Color(0xFF8B5CF6),
      'count': 20
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1F1F1F), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Nos Produits',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Color(0xFF1F1F1F)),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined, color: Color(0xFF1F1F1F)),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              'Que souhaitez-vous aujourd\'hui ?',
              style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F)),
            ),
            const SizedBox(height: 4),
            Text(
              'Choisissez une catégorie',
              style: GoogleFonts.poppins(fontSize: 15, color: const Color(0xFF6B7280)),
            ),

            const SizedBox(height: 24),

            // Grid (2 columns, spacing 16)
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.1,
              ),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final cat = _categories[index];
                final Color color = cat['color'];

                return InkWell(
                  onTap: () {},
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: color.withOpacity(0.2), width: 1.5),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: color,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Icon(cat['icon'], color: Colors.white, size: 26),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${cat['count']}',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: color,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              cat['title'],
                              style: GoogleFonts.poppins(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF1F1F1F),
                              ),
                            ),
                            Text(
                              '${cat['count']} articles',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: const Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
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
