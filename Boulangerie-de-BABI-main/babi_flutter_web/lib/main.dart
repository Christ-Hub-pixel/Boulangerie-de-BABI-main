import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const BabiBakeryApp());
}

class BabiBakeryApp extends StatelessWidget {
  const BabiBakeryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Boulangerie de BABI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Roboto',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFB923C),
          primary: const Color(0xFFFB923C),
          surface: const Color(0xFF2B160C),
        ),
        scaffoldBackgroundColor: const Color(0xFFFAF7F2),
      ),
      home: const SplashScreen(),
    );
  }
}

// Product Model
class Product {
  final String id;
  final String name;
  final String category;
  final double price;
  final String imageUrl;

  Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.imageUrl,
  });
}

// Cart Item Model
class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  double get totalPrice => product.price * quantity;
}

class BabiHomeScreen extends StatefulWidget {
  const BabiHomeScreen({super.key});

  @override
  State<BabiHomeScreen> createState() => _BabiHomeScreenState();
}

class _BabiHomeScreenState extends State<BabiHomeScreen> {
  String selectedCategory = 'Tous';
  String searchQuery = '';
  final Set<String> favoriteIds = {};
  final List<CartItem> cart = [];

  final List<Product> products = [
    Product(id: '1', name: 'Baguette Tradition 150', category: 'Pains', price: 150, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
    Product(id: '2', name: 'Baguette Douce 200', category: 'Pains', price: 200, imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400'),
    Product(id: '3', name: 'Pain de Mie Sucré 500', category: 'Pains', price: 500, imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400'),
    Product(id: '4', name: 'Croissant Pur Beurre', category: 'Viennoiseries', price: 500, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
    Product(id: '5', name: 'Pain au Chocolat', category: 'Viennoiseries', price: 500, imageUrl: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400'),
    Product(id: '6', name: 'Brioche Tressée', category: 'Viennoiseries', price: 1500, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'),
    Product(id: '7', name: 'Éclair au Chocolat', category: 'Pâtisseries', price: 1000, imageUrl: 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=400'),
    Product(id: '8', name: 'Tartelette aux Fraises', category: 'Pâtisseries', price: 1500, imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400'),
    Product(id: '9', name: 'Entremet Chocolat Intense', category: 'Pâtisseries', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'),
    Product(id: '10', name: 'Jus de Baobab Naturel (Bouye)', category: 'Jus', price: 500, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400'),
    Product(id: '11', name: 'Jus de Bissap Rouge', category: 'Jus', price: 500, imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400'),
    Product(id: '12', name: 'Canette Youki Moka', category: 'Boissons', price: 500, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'),
  ];

  bool isStoreOpen() {
    final now = DateTime.now();
    final currentMinutes = now.hour * 60 + now.minute;
    final openMinutes = 5 * 60 + 45; // 05h45
    final closeMinutes = 23 * 60; // 23h00
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  void showStoreClosedDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: const Color(0xFF2B160C),
        title: const Row(
          children: [
            Icon(Icons.bedtime, color: Color(0xFFFB923C)),
            SizedBox(width: 8),
            Text('Boulangerie Fermée', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Nos fours se préparent pour vous accueillir dès 05h45 du matin ! Les commandes en ligne réouvriront à 05h45.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFB923C)),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('J\'ai compris', style: TextStyle(color: Color(0xFF2B160C), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void addToCart(Product product) {
    if (!isStoreOpen()) {
      showStoreClosedDialog();
      return;
    }
    setState(() {
      final existingIndex = cart.indexWhere((item) => item.product.id == product.id);
      if (existingIndex >= 0) {
        cart[existingIndex].quantity++;
      } else {
        cart.add(CartItem(product: product));
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} ajouté au panier !'),
        backgroundColor: const Color(0xFF2B160C),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void toggleFavorite(String productId) {
    setState(() {
      if (favoriteIds.contains(productId)) {
        favoriteIds.remove(productId);
      } else {
        favoriteIds.add(productId);
      }
    });
  }

  double get cartTotal => cart.fold(0, (sum, item) => sum + item.totalPrice);
  int get cartCount => cart.fold(0, (sum, item) => sum + item.quantity);

  @override
  Widget build(BuildContext context) {
    final filteredProducts = products.where((p) {
      final matchesCat = selectedCategory == 'Tous' || p.category == selectedCategory;
      final matchesSearch = p.name.toLowerCase().contains(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    }).toList();

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(70),
        child: Container(
          color: const Color(0xFF2B160C),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Row(
            children: [
              // Logo
              Container(
                width: 45,
                height: 45,
                decoration: BoxDecoration(
                  color: const Color(0xFFFB923C),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Text('BB', style: TextStyle(color: Color(0xFF2B160C), fontWeight: FontWeight.w900, fontSize: 20)),
                ),
              ),
              const SizedBox(width: 12),
              const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Boulangerie', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('DE BABI', style: TextStyle(color: Color(0xFFFB923C), fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1)),
                ],
              ),
              const Spacer(),
              // Search Bar
              Flexible(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 320),
                  height: 42,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(50),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    onChanged: (val) => setState(() => searchQuery = val),
                    decoration: const InputDecoration(
                      hintText: 'Chercher un produit...',
                      border: InputBorder.none,
                      icon: Icon(Icons.search, color: Colors.grey),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 20),
              // Favorites Button
              Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.favorite, color: Colors.redAccent, size: 28),
                    onPressed: () {},
                  ),
                  if (favoriteIds.isNotEmpty)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: CircleAvatar(
                        radius: 8,
                        backgroundColor: Colors.red,
                        child: Text('${favoriteIds.length}', style: const TextStyle(color: Colors.white, fontSize: 10)),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              // Cart Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFB923C),
                  foregroundColor: const Color(0xFF2B160C),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                ),
                onPressed: () => openCartDrawer(),
                icon: const Icon(Icons.shopping_cart),
                label: Text('Panier ($cartCount)', style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Banner Hero
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF2B160C), Color(0xFF422212)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                children: [
                  const Text('🥖 Le Savoir-Faire Artisanal à Abidjan', style: TextStyle(color: Color(0xFFFB923C), fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text('PAINS CHAUDS & PÂTISSERIES DE BABI', style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 12),
                  const Text('Commandez en ligne et faites-vous livrer en scooter partout à Abidjan !', style: TextStyle(color: Colors.white70, fontSize: 15)),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFB923C),
                          foregroundColor: const Color(0xFF2B160C),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                        onPressed: () {},
                        child: const Text('VOIR LES PRODUITS', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 16),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                        onPressed: () {},
                        child: const Text('NOS HORAIRES (06h - 20h)'),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // Categories Filter
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: ['Tous', 'Pains', 'Viennoiseries', 'Pâtisseries', 'Jus', 'Boissons'].map((cat) {
                  final isSelected = selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSelected,
                      selectedColor: const Color(0xFFFB923C),
                      backgroundColor: Colors.white,
                      labelStyle: TextStyle(
                        color: isSelected ? const Color(0xFF2B160C) : Colors.black87,
                        fontWeight: FontWeight.bold,
                      ),
                      onSelected: (selected) {
                        setState(() => selectedCategory = cat);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 30),

            // Products Grid
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  int crossAxisCount = constraints.maxWidth > 1000 ? 4 : (constraints.maxWidth > 700 ? 3 : 2);
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      childAspectRatio: 0.75,
                      crossAxisSpacing: 20,
                      mainAxisSpacing: 20,
                    ),
                    itemCount: filteredProducts.length,
                    itemBuilder: (context, index) {
                      final product = filteredProducts[index];
                      final isFav = favoriteIds.contains(product.id);
                      return Card(
                        elevation: 4,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Stack(
                                children: [
                                  Image.network(
                                    product.imageUrl,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => Container(
                                      color: const Color(0xFFFED7AA),
                                      child: const Center(
                                        child: Icon(Icons.bakery_dining, size: 48, color: Color(0xFF2B160C)),
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    top: 8,
                                    right: 8,
                                    child: CircleAvatar(
                                      backgroundColor: Colors.white.withOpacity(0.8),
                                      child: IconButton(
                                        icon: Icon(
                                          isFav ? Icons.favorite : Icons.favorite_border,
                                          color: isFav ? Colors.red : Colors.grey,
                                        ),
                                        onPressed: () => toggleFavorite(product.id),
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
                                  Text(
                                    product.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${product.price.toInt()} FCFA',
                                    style: const TextStyle(color: Color(0xFFFB923C), fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  const SizedBox(height: 8),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF2B160C),
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      onPressed: () => addToCart(product),
                                      child: const Text('Ajouter au panier'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),

            const SizedBox(height: 60),

            // Footer
            Container(
              color: const Color(0xFF2B160C),
              padding: const EdgeInsets.all(40),
              child: const Column(
                children: [
                  Wrap(
                    spacing: 40,
                    runSpacing: 24,
                    alignment: WrapAlignment.spaceAround,
                    crossAxisAlignment: WrapCrossAlignment.start,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Boulangerie de BABI', style: TextStyle(color: Color(0xFFFB923C), fontWeight: FontWeight.bold, fontSize: 18)),
                          SizedBox(height: 8),
                          Text('Cocody Riviera 2, Abidjan - Côte d\'Ivoire', style: TextStyle(color: Colors.white)),
                          Text('Fixe : 27 22 56 41 23', style: TextStyle(color: Colors.white)),
                          Text('Mobiles : 07 04 38 92 01 / 07 06 81 79 77', style: TextStyle(color: Colors.white)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('HORAIRES DE LA BOUTIQUE', style: TextStyle(color: Color(0xFFFB923C), fontWeight: FontWeight.bold, fontSize: 18)),
                          SizedBox(height: 8),
                          Text('Lundi - Dimanche : 05h45 - 23h00', style: TextStyle(color: Colors.white)),
                          SizedBox(height: 6),
                          Text('SORTIES DE PAIN CHAUDS', style: TextStyle(color: Color(0xFFFB923C), fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('06h00 • 09h00 • 14h00 • 17h00 • 18h00', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('PAIEMENT ACCEPTÉ', style: TextStyle(color: Color(0xFFFB923C), fontWeight: FontWeight.bold, fontSize: 18)),
                          SizedBox(height: 8),
                          Text('🌊 Wave Mobile Money', style: TextStyle(color: Colors.white)),
                          Text('🍊 Orange Money', style: TextStyle(color: Colors.white)),
                          Text('💵 Espèces à la livraison', style: TextStyle(color: Colors.white)),
                        ],
                      ),
                    ],
                  ),
                  SizedBox(height: 30),
                  Divider(color: Colors.white24),
                  SizedBox(height: 10),
                  Text('© 2026 Boulangerie de Babi. Tous droits réservés.', style: TextStyle(color: Colors.white54, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void openCartDrawer() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Votre Panier BABI', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const Divider(),
            Expanded(
              child: cart.isEmpty
                  ? const Center(child: Text('Votre panier est vide.'))
                  : ListView.builder(
                      itemCount: cart.length,
                      itemBuilder: (ctx, idx) {
                        final item = cart[idx];
                        return ListTile(
                          leading: Image.network(
                            item.product.imageUrl,
                            width: 40,
                            height: 40,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              width: 40,
                              height: 40,
                              color: const Color(0xFFFED7AA),
                              child: const Icon(Icons.bakery_dining, size: 20, color: Color(0xFF2B160C)),
                            ),
                          ),
                          title: Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('${item.product.price.toInt()} FCFA x ${item.quantity}'),
                          trailing: Text('${item.totalPrice.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFFB923C))),
                        );
                      },
                    ),
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text('${cartTotal.toInt()} FCFA', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFFFB923C))),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFB923C),
                  foregroundColor: const Color(0xFF2B160C),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: cart.isEmpty ? null : () {
                  Navigator.pop(ctx);
                  showDialog(
                    context: context,
                    builder: (c) => BabiMobilePaymentModal(totalAmount: cartTotal),
                  );
                },
                child: const Text('PASSER LA COMMANDE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BabiMobilePaymentModal extends StatefulWidget {
  final double totalAmount;
  const BabiMobilePaymentModal({super.key, required this.totalAmount});

  @override
  State<BabiMobilePaymentModal> createState() => _BabiMobilePaymentModalState();
}

class _BabiMobilePaymentModalState extends State<BabiMobilePaymentModal> {
  String selectedMethod = 'Wave';
  bool isProcessing = false;
  bool isSuccess = false;

  void processPayment() {
    setState(() => isProcessing = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          isProcessing = false;
          isSuccess = true;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Icon(selectedMethod == 'Wave' ? Icons.water : Icons.mobile_friendly, color: const Color(0xFFFB923C)),
          const SizedBox(width: 8),
          Text(
            isSuccess ? 'Paiement Confirmé !' : 'Paiement $selectedMethod Direct',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
        ],
      ),
      content: isSuccess
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 64),
                const SizedBox(height: 12),
                Text('Paiement de ${widget.totalAmount.toInt()} FCFA validé avec succès !', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Votre commande de pain chaud est en préparation.', style: TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('Wave 🌊'),
                      selected: selectedMethod == 'Wave',
                      onSelected: (s) => setState(() => selectedMethod = 'Wave'),
                    ),
                    ChoiceChip(
                      label: const Text('Orange 🍊'),
                      selected: selectedMethod == 'Orange Money',
                      onSelected: (s) => setState(() => selectedMethod = 'Orange Money'),
                    ),
                    ChoiceChip(
                      label: const Text('MTN 🟡'),
                      selected: selectedMethod == 'MTN MoMo',
                      onSelected: (s) => setState(() => selectedMethod = 'MTN MoMo'),
                    ),
                    ChoiceChip(
                      label: const Text('Moov 🔵'),
                      selected: selectedMethod == 'Moov Money',
                      onSelected: (s) => setState(() => selectedMethod = 'Moov Money'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('${widget.totalAmount.toInt()} FCFA', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Color(0xFFFB923C))),
                const SizedBox(height: 12),
                if (selectedMethod == 'Wave') ...[
                  Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(color: Colors.cyan.shade100, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.qr_code_2, size: 90, color: Color(0xFF2B160C)),
                  ),
                  const SizedBox(height: 8),
                  const Text('Scannez le QR Code ou validez dans Wave', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ] else if (selectedMethod == 'Orange Money') ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(color: Colors.orange.shade100, borderRadius: BorderRadius.circular(20)),
                    child: const Text('Code USSD : #144*82#', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2B160C))),
                  ),
                  const SizedBox(height: 8),
                  const Text('Saisissez votre code secret sur votre téléphone', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ] else if (selectedMethod == 'MTN MoMo') ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(20)),
                    child: const Text('Code USSD : #133#', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2B160C))),
                  ),
                  const SizedBox(height: 8),
                  const Text('Validez la demande Push dans votre menu MTN MoMo', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ] else ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(color: Colors.lightBlue.shade100, borderRadius: BorderRadius.circular(20)),
                    child: const Text('Code USSD : #145#', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2B160C))),
                  ),
                  const SizedBox(height: 8),
                  const Text('Entrez votre code secret Moov Money pour valider', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ],
                const SizedBox(height: 16),
                if (isProcessing) const CircularProgressIndicator(color: Color(0xFFFB923C)),
              ],
            ),
      actions: [
        if (isSuccess)
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFB923C)),
            onPressed: () {
              Navigator.pop(context);
              showDialog(context: context, builder: (c) => const OrderRatingDialog());
            },
            child: const Text('Donner mon avis', style: TextStyle(color: Color(0xFF2B160C), fontWeight: FontWeight.bold)),
          )
        else if (!isProcessing)
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2B160C)),
            onPressed: processPayment,
            child: Text('Valider avec $selectedMethod', style: const TextStyle(color: Colors.white)),
          ),
      ],
    );
  }
}

class OrderRatingDialog extends StatefulWidget {
  const OrderRatingDialog({super.key});

  @override
  State<OrderRatingDialog> createState() => _OrderRatingDialogState();
}

class _OrderRatingDialogState extends State<OrderRatingDialog> {
  int rating = 5;
  final Set<String> selectedTags = {};

  final positiveTags = [
    '🥖 Pain chaud & croustillant',
    '⚡ Livraison ultra rapide',
    '🤝 Livreur courtois',
    '🧁 Emballage soigné',
    '😋 Pâtisseries délicieuses',
  ];

  final negativeTags = [
    '⏳ Retard de livraison',
    '❄️ Produit refroidi',
    '📦 Emballage abîmé',
    '❌ Article manquant',
    '📱 Livreur difficile à joindre',
  ];

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Row(
        children: [
          Icon(Icons.star, color: Colors.amber),
          SizedBox(width: 8),
          Text('Votre avis sur la commande', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                return IconButton(
                  icon: Icon(
                    index < rating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 32,
                  ),
                  onPressed: () => setState(() => rating = index + 1),
                );
              }),
            ),
            const SizedBox(height: 12),
            const Text('Ce que vous avez aimé (Positif) :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.green)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: positiveTags.map((tag) {
                final isSel = selectedTags.contains(tag);
                return FilterChip(
                  label: Text(tag, style: const TextStyle(fontSize: 11)),
                  selected: isSel,
                  selectedColor: Colors.amber.shade300,
                  onSelected: (val) {
                    setState(() {
                      if (val) {
                        selectedTags.add(tag);
                      } else {
                        selectedTags.remove(tag);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            const Text('Points d\'amélioration (Négatif) :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.red)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: negativeTags.map((tag) {
                final isSel = selectedTags.contains(tag);
                return FilterChip(
                  label: Text(tag, style: const TextStyle(fontSize: 11)),
                  selected: isSel,
                  selectedColor: Colors.red.shade200,
                  onSelected: (val) {
                    setState(() {
                      if (val) {
                        selectedTags.add(tag);
                      } else {
                        selectedTags.remove(tag);
                      }
                    });
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ),
      actions: [
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFB923C)),
          onPressed: () {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Merci pour votre avis !')),
            );
          },
          child: const Text('Envoyer mon avis', style: TextStyle(color: Color(0xFF2B160C), fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
