import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  String _selectedCategory = 'Tous';

  final List<Map<String, dynamic>> _favoriteProducts = [
    {
      'id': '1',
      'name': 'Baguette Douce 200',
      'category': 'Pain',
      'price': 200,
      'oldPrice': 250,
      'rating': 4.9,
      'image': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400',
    },
    {
      'id': '2',
      'name': 'Pain au Chocolat',
      'category': 'Viennoiseries',
      'price': 500,
      'oldPrice': null,
      'rating': 4.8,
      'image': 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400',
    },
    {
      'id': '3',
      'name': 'Éclair au Chocolat',
      'category': 'Pâtisseries',
      'price': 1000,
      'oldPrice': 1200,
      'rating': 4.9,
      'image': 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=400',
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
          'Mes Favoris',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search, color: Color(0xFF1F1F1F)), onPressed: () {}),
          IconButton(icon: const Icon(Icons.shopping_cart_outlined, color: Color(0xFF1F1F1F)), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Vos produits préférés', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold)),
                  Text('Retrouvez-les à tout moment.', style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey)),
                ],
              ),
            ),

            // Filters
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: ['Tous', 'Pain', 'Viennoiseries', 'Pâtisseries', 'Sandwichs'].map((cat) {
                  final isSel = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSel,
                      selectedColor: primaryColor,
                      backgroundColor: Colors.white,
                      labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                      onSelected: (val) => setState(() => _selectedCategory = cat),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 20),

            // Products Grid
            _favoriteProducts.isEmpty
                ? const Center(child: Text('Aucun favori pour le moment'))
                : Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.75,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: _favoriteProducts.length,
                      itemBuilder: (context, index) {
                        final p = _favoriteProducts[index];
                        return Container(
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                          clipBehavior: Clip.antiAlias,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Stack(
                                  children: [
                                    Image.network(p['image'], width: double.infinity, fit: BoxFit.cover),
                                    Positioned(
                                      top: 8,
                                      right: 8,
                                      child: CircleAvatar(
                                        backgroundColor: Colors.white,
                                        child: IconButton(
                                          icon: const Icon(Icons.favorite, color: Colors.red, size: 20),
                                          onPressed: () => setState(() => _favoriteProducts.removeAt(index)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p['name'], style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1),
                                    Text('${p['price']} FCFA', style: GoogleFonts.poppins(color: primaryColor, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}
