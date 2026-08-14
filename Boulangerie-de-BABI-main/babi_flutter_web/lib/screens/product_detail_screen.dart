import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productName;
  final double price;
  final String imageUrl;

  const ProductDetailScreen({
    super.key,
    this.productName = 'Baguette Tradition 150',
    this.price = 150,
    this.imageUrl = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;
  String _selectedSize = 'Moyen';
  String _selectedCuisson = 'Standard';
  bool _isFavorite = false;

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
          'Détails du produit',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 16),
        ),
        actions: [
          IconButton(
            icon: Icon(_isFavorite ? Icons.favorite : Icons.favorite_border, color: _isFavorite ? Colors.red : const Color(0xFF1F1F1F)),
            onPressed: () => setState(() => _isFavorite = !_isFavorite),
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF1F1F1F)),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined, color: Color(0xFF1F1F1F)),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Gallery / Image Carousel
            Container(
              height: 280,
              width: double.infinity,
              color: Colors.white,
              child: Stack(
                children: [
                  Center(
                    child: Image.network(
                      widget.imageUrl,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: const Color(0xFFFFF3D6),
                          child: const Center(
                            child: Icon(Icons.bakery_dining_rounded, size: 100, color: primaryColor),
                          ),
                        );
                      },
                    ),
                  ),

                  // Badges
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Wrap(
                      spacing: 8,
                      children: [
                        _buildBadge('Nouveau', Colors.blue),
                        _buildBadge('Promotion', Colors.red),
                        _buildBadge('Meilleure vente', const Color(0xFFF4B400)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Rating
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          widget.productName,
                          style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F)),
                        ),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 20),
                          const SizedBox(width: 4),
                          Text('4.8 (1240 av.)', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Price & Stock
                  Row(
                    children: [
                      Text(
                        '${widget.price.toInt()} FCFA',
                        style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.w800, color: primaryColor),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '200 FCFA',
                        style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey, decoration: TextDecoration.lineThrough),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: Colors.green.shade100, borderRadius: BorderRadius.circular(6)),
                        child: Text('En Stock (24)', style: GoogleFonts.poppins(fontSize: 11, color: Colors.green.shade800, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Delivery info
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                    child: Row(
                      children: [
                        const Icon(Icons.two_wheeler_rounded, color: primaryColor),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Livraison estimée : 20-45 min • Retrait disponible',
                            style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF4B5563)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Options: Taille
                  Text('Taille', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: ['Petit', 'Moyen', 'Grand'].map((size) {
                      final isSelected = _selectedSize == size;
                      return Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: ChoiceChip(
                          label: Text(size),
                          selected: isSelected,
                          selectedColor: primaryColor,
                          backgroundColor: Colors.white,
                          labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                          onSelected: (val) => setState(() => _selectedSize = size),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 16),

                  // Options: Cuisson
                  Text('Cuisson', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: ['Standard', 'Bien cuit'].map((cuisson) {
                      final isSelected = _selectedCuisson == cuisson;
                      return Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: ChoiceChip(
                          label: Text(cuisson),
                          selected: isSelected,
                          selectedColor: primaryColor,
                          backgroundColor: Colors.white,
                          labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                          onSelected: (val) => setState(() => _selectedCuisson = cuisson),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 20),

                  // Quantity Selector
                  Row(
                    children: [
                      Text('Quantité :', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 16),
                      Container(
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(30)),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                            ),
                            Text('$_quantity', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed: _quantity < 99 ? () => setState(() => _quantity++) : null,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Description
                  ExpansionTile(
                    title: Text('Description', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                    initiallyExpanded: true,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Text(
                          'Notre Baguette Tradition est pétrie et cuite sur place plusieurs fois par jour pour vous garantir un croustillant inégalé et une mie alvéolée au goût authentique.',
                          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF4B5563), height: 1.5),
                        ),
                      ),
                    ],
                  ),

                  // Ingrédients
                  ExpansionTile(
                    title: Text('Ingrédients', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Text(
                          'Farine de blé T65, eau filtrée, sel de mer, levain naturel, levure boulangère.',
                          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF4B5563)),
                        ),
                      ),
                    ],
                  ),

                  // Allergènes
                  ExpansionTile(
                    title: Text('Allergènes', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Text(
                          'Contient du Gluten. Peut contenir des traces de sésame et de fruits à coque.',
                          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF4B5563)),
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
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, -4))],
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1F1F1F),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Ajouté au panier !')),
                  );
                },
                child: Text('Ajouter au panier', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () {},
                child: Text('Acheter maintenant', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: GoogleFonts.poppins(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
