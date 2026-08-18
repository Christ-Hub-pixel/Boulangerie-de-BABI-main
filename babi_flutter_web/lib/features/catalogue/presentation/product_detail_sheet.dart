import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../cart/domain/cart_item.dart';
import '../../cart/providers/cart_provider.dart';

class ProductDetailSheet extends ConsumerStatefulWidget {
  final String id;
  final String name;
  final double price;
  final String imagePath;
  final String category;
  final String? description;
  final bool isAvailable;

  const ProductDetailSheet({
    super.key,
    required this.id,
    required this.name,
    required this.price,
    required this.imagePath,
    this.category = 'Boulangerie',
    this.description,
    this.isAvailable = true,
  });

  static void show(
    BuildContext context, {
    required String id,
    required String name,
    required double price,
    required String imagePath,
    String category = 'Boulangerie',
    String? description,
    bool isAvailable = true,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ProductDetailSheet(
        id: id,
        name: name,
        price: price,
        imagePath: imagePath,
        category: category,
        description: description,
        isAvailable: isAvailable,
      ),
    );
  }

  @override
  ConsumerState<ProductDetailSheet> createState() => _ProductDetailSheetState();
}

class _ProductDetailSheetState extends ConsumerState<ProductDetailSheet> {
  int _quantity = 1;
  String _selectedOption = 'Standard';
  String _selectedCuisson = 'Doré à souhait';
  bool _isFavorite = false;

  final List<String> _options = ['Standard', 'Format Familial (+500 F)', 'Option Tranché (+100 F)'];
  final List<String> _cuissons = ['Moelleux / Blanc', 'Doré à souhait', 'Bien cuit / Croustillant'];

  double get _calculatedPrice {
    double base = widget.price;
    if (_selectedOption.contains('+500')) base += 500;
    if (_selectedOption.contains('+100')) base += 100;
    return base * _quantity;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: FractionallySizedBox(
        heightFactor: 0.88,
        child: Column(
          children: [
            // Header Handle
            const SizedBox(height: 12),
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product Image Box
                    Stack(
                      children: [
                        Container(
                          height: 220,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9F9F9),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Image.asset(
                                widget.imagePath,
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) => const Icon(
                                  Icons.bakery_dining,
                                  size: 100,
                                  color: Color(0xFFFACC15),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 12,
                          left: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: widget.isAvailable ? const Color(0xFF22C55E) : Colors.redAccent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              widget.isAvailable ? 'En stock' : 'Rupture',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 12,
                          right: 12,
                          child: CircleAvatar(
                            backgroundColor: Colors.white,
                            radius: 20,
                            child: IconButton(
                              icon: Icon(
                                _isFavorite ? Icons.favorite : Icons.favorite_border,
                                color: _isFavorite ? Colors.red : const Color(0xFFFACC15),
                                size: 20,
                              ),
                              onPressed: () {
                                setState(() => _isFavorite = !_isFavorite);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    
                    // Category & Title
                    Text(
                      widget.category.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFCA8A04),
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.name,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${widget.price.toInt()} FCFA / unité',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.black87,
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    const Divider(color: Colors.black12),
                    const SizedBox(height: 8),
                    
                    // Description
                    const Text(
                      'Description & Savoir-faire',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.description ??
                          'Préparé avec soin par nos maîtres boulangers à Abidjan. Farine de première qualité, beurre pur et temps de pousse respecté pour une mie aérée et croustillante.',
                      style: const TextStyle(fontSize: 14, color: Colors.black54, height: 1.5),
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Variants / Options
                    const Text(
                      'Choisir une variante',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _options.map((opt) {
                        final isSelected = opt == _selectedOption;
                        return ChoiceChip(
                          label: Text(opt),
                          selected: isSelected,
                          selectedColor: const Color(0xFFFACC15),
                          backgroundColor: const Color(0xFFF5F5F5),
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.black87 : Colors.black54,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                          onSelected: (selected) {
                            if (selected) setState(() => _selectedOption = opt);
                          },
                        );
                      }).toList(),
                    ),
                    
                    const SizedBox(height: 18),
                    
                    // Cooking Preference
                    const Text(
                      'Préférence de cuisson',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _cuissons.map((c) {
                        final isSelected = c == _selectedCuisson;
                        return ChoiceChip(
                          label: Text(c),
                          selected: isSelected,
                          selectedColor: const Color(0xFFFFF3D6),
                          backgroundColor: const Color(0xFFF5F5F5),
                          side: BorderSide(color: isSelected ? const Color(0xFFFACC15) : Colors.transparent),
                          labelStyle: TextStyle(
                            color: isSelected ? const Color(0xFFB45309) : Colors.black54,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                          onSelected: (selected) {
                            if (selected) setState(() => _selectedCuisson = c);
                          },
                        );
                      }).toList(),
                    ),
                    
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
            
            // Bottom Action Bar (Quantity & Add to Cart)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 20,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    // Quantity Counter
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F5F5),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove, size: 18),
                            onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                          ),
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 250),
                            transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
                            child: Text(
                              '$_quantity',
                              key: ValueKey<int>(_quantity),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add, size: 18),
                            onPressed: () => setState(() => _quantity++),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    
                    // Add Button
                    Expanded(
                      child: ElevatedButton(
                        onPressed: !widget.isAvailable
                            ? null
                            : () {
                                final extra = _selectedOption.contains('+500') ? 500.0 : (_selectedOption.contains('+100') ? 100.0 : 0.0);
                                final unitPrice = widget.price + extra;
                                ref.read(cartProvider.notifier).addItem(
                                  CartItem(
                                    id: widget.id,
                                    name: _selectedOption != 'Standard' ? '${widget.name} ($_selectedOption)' : widget.name,
                                    price: unitPrice,
                                    icon: Icons.bakery_dining,
                                    quantity: _quantity,
                                  ),
                                );
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('$_quantity x ${widget.name} ajouté(s) au panier !'),
                                    backgroundColor: const Color(0xFFFACC15),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFACC15),
                          foregroundColor: Colors.black87,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                        ),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 250),
                          child: Text(
                            'Ajouter • ${_calculatedPrice.toInt()} FCFA',
                            key: ValueKey<double>(_calculatedPrice),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ),
                      ),
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
