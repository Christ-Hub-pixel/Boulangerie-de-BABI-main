import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../presentation/role_switcher_sheet.dart';
import '../../../../core/data/dummy_products.dart';

class ManagerDashboardScreen extends StatefulWidget {
  const ManagerDashboardScreen({super.key});

  @override
  State<ManagerDashboardScreen> createState() => _ManagerDashboardScreenState();
}

class _ManagerDashboardScreenState extends State<ManagerDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<Map<String, dynamic>> _products = List.from(ProductData.products);
  String _selectedCategoryFilter = 'Tous';
  final TextEditingController _searchProductController = TextEditingController();
  String _searchProductQuery = '';
  int _reportPeriod = 0; // 0: Aujourd'hui, 1: 7 Jours, 2: Ce Mois

  final List<Map<String, dynamic>> _fournilOrders = [
    {
      'id': 'EVT-48201',
      'client': 'Mme Koné Fatou (+225 07 45 67 89)',
      'items': '🎂 GÂTEAU MARIAGE (30-40 parts) • Chocolat Valrhona & Décor Doré • Inscription: "Félicitations Fatou & Marc ❤️"',
      'total': '78 000 F',
      'payment': 'Wave (Acompte 50% - 39 000 F réglé)',
      'status': 'Atelier Pâtisserie (Décoration)',
      'statusCode': 1,
      'isEventCake': true,
      'eventDate': 'Samedi à 15:00',
    },
    {
      'id': 'BAB-9842',
      'client': 'Koffi Kouamé',
      'items': '2x Croissant Pur Beurre, 1x Baguette Dorée, 1x Jus de Bissap',
      'total': '3 200 F',
      'payment': 'Wave (Payé)',
      'status': 'Prête au comptoir',
      'statusCode': 2, // 0: Reçue, 1: Au fournil, 2: Prête au comptoir, 3: Clôturée
    },
    {
      'id': 'BAB-7319',
      'client': 'Aïcha Diarra',
      'items': '1x Forêt Noire Pâtissière, 1x Chocolat Chaud',
      'total': '5 500 F',
      'payment': 'Espèces (À encaisser)',
      'status': 'Au fournil (Préparation)',
      'statusCode': 1,
    },
    {
      'id': 'BAB-5421',
      'client': 'Jean-Marc Bado',
      'items': '4x Pain au Chocolat, 1x Pain Complet',
      'total': '3 000 F',
      'payment': 'Wave (Payé)',
      'status': 'Au fournil (Cuisson)',
      'statusCode': 1,
    },
    {
      'id': 'BAB-4108',
      'client': 'Saliou Diallo',
      'items': '3x Baguette Tradition, 2x Américain Poulet',
      'total': '2 000 F',
      'payment': 'Wave (Payé)',
      'status': 'Reçue / En attente',
      'statusCode': 0,
    },
  ];

  final List<Map<String, dynamic>> _employees = [
    {'name': 'Aminata Traoré', 'role': 'Caissière Principale', 'phone': '+225 07 88 99 00', 'shift': '06:00 - 14:00', 'status': 'En poste', 'active': true},
    {'name': 'Mamadou Koné', 'role': 'Maître Boulanger', 'phone': '+225 05 11 22 33', 'shift': '04:00 - 12:00', 'status': 'Au fournil', 'active': true},
    {'name': 'Clarisse Yao', 'role': 'Chef Pâtissière', 'phone': '+225 01 44 55 66', 'shift': '06:00 - 15:00', 'status': 'En poste', 'active': true},
    {'name': 'Jean-Marc B.', 'role': 'Caissier Renfort', 'phone': '+225 07 12 34 56', 'shift': '14:00 - 22:00', 'status': 'En pause', 'active': false},
  ];

  final List<Map<String, dynamic>> _eventCakeBookings = [
    {
      'id': 'BABI-EVT-842109',
      'client': 'Mme Koné Fatou',
      'phone': '+225 07 45 67 89',
      'eventType': '💍 Mariage & Réception',
      'size': '30 - 40 parts (2 étages)',
      'flavor': '🍫 Chocolat Valrhona & Praliné Craquant',
      'finish': '✨ Glaçage Miroir & Décor Doré',
      'customText': 'Félicitations Fatou & Marc ❤️',
      'date': '18/08/2026',
      'time': '15:00',
      'total': 86000,
      'deposit': 43000,
      'status': 'Acompte Validé (Wave)',
      'statusCode': 1, // 0: Devis Reçu, 1: Acompte Validé, 2: En préparation Pâtisserie, 3: Prêt au Comptoir, 4: Livré
    },
    {
      'id': 'BABI-EVT-910423',
      'client': 'M. Amani Kouadio',
      'phone': '+225 05 88 12 34',
      'eventType': '🎂 Anniversaire 30 ans',
      'size': '18 - 22 parts (1 étage)',
      'flavor': '🍓 Fraisier Tradition & Crème Mousseline',
      'finish': '🌸 Fleurs Fraîches & Macarons',
      'customText': 'Joyeux Anniversaire Aminata 🌸',
      'date': '19/08/2026',
      'time': '11:30',
      'total': 42000,
      'deposit': 21000,
      'status': 'En préparation Pâtisserie',
      'statusCode': 2,
    },
    {
      'id': 'BABI-EVT-302198',
      'client': 'Mme Bamba Sarah (Orange CI)',
      'phone': '+225 07 01 22 33',
      'eventType': '🏢 Événement Entreprise / Gala',
      'size': '50+ parts (Pièce Montée Royale - 3 étages)',
      'flavor': '🥭 Mangue-Passion Tropicale d\'Abidjan',
      'finish': '👑 Feuille d\'Or 24K & Logo Alimentaire',
      'customText': 'Excellence Orange CI 2026 🚀',
      'date': '22/08/2026',
      'time': '17:00',
      'total': 153000,
      'deposit': 76500,
      'status': 'Devis Reçu',
      'statusCode': 0,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchProductController.dispose();
    super.dispose();
  }

  void _toggleProductAvailability(Map<String, dynamic> product) {
    setState(() {
      product['isAvailable'] = !(product['isAvailable'] ?? true);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product['name']} est maintenant ${(product['isAvailable'] ?? true) ? 'DISPONIBLE EN BOUTIQUE' : 'EN RUPTURE DE STOCK'}'),
        duration: const Duration(seconds: 1),
        backgroundColor: const Color(0xFF0F172A),
      ),
    );
  }

  void _editProductPrice(Map<String, dynamic> product) {
    final priceCtrl = TextEditingController(text: (product['price'] as num).toInt().toString());
    final stockCtrl = TextEditingController(text: (product['stock'] ?? 45).toString());
    final thresholdCtrl = TextEditingController(text: (product['minThreshold'] ?? 10).toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.edit_note_rounded, color: Color(0xFF0F172A)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Gérer : ${product['name']}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: priceCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Prix unitaire (FCFA)', suffixText: 'FCFA', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: stockCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Stock disponible (Unités)', suffixIcon: Icon(Icons.inventory_2_outlined), border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: thresholdCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Seuil d\'alerte stock faible', suffixIcon: Icon(Icons.warning_amber_rounded), border: OutlineInputBorder()),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () {
              final newPrice = double.tryParse(priceCtrl.text.trim());
              final newStock = int.tryParse(stockCtrl.text.trim());
              final newThreshold = int.tryParse(thresholdCtrl.text.trim());

              if (newPrice != null && newPrice > 0) {
                setState(() {
                  product['price'] = newPrice;
                  if (newStock != null) product['stock'] = newStock;
                  if (newThreshold != null) product['minThreshold'] = newThreshold;
                  if (newStock != null && newStock == 0) {
                    product['isAvailable'] = false;
                  }
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${product['name']} mis à jour (Prix: ${newPrice.toInt()} F, Stock: ${newStock ?? 45})'),
                    backgroundColor: const Color(0xFF16A34A),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: const Color(0xFFFACC15)),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  void _openAddProductModal() {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    String category = 'Pains';
    bool isAvailable = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Row(
            children: [
              Icon(Icons.add_box_rounded, color: Color(0xFF0F172A)),
              SizedBox(width: 10),
              Text('Ajouter un Produit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Nom du produit (ex: Brioche Tressée)', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: category,
                  decoration: const InputDecoration(labelText: 'Catégorie', border: OutlineInputBorder()),
                  items: ['Pains', 'Viennoiseries', 'Pâtisseries', 'Boissons', 'Salés']
                      .map((cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setModalState(() => category = val);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: priceCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Prix unitaire (FCFA)', border: OutlineInputBorder(), suffixText: 'FCFA'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text('Disponible immédiatement en boutique', style: TextStyle(fontSize: 13)),
                  value: isAvailable,
                  activeThumbColor: const Color(0xFF16A34A),
                  contentPadding: EdgeInsets.zero,
                  onChanged: (val) => setModalState(() => isAvailable = val),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
            ElevatedButton(
              onPressed: () {
                final name = nameCtrl.text.trim();
                final price = double.tryParse(priceCtrl.text.trim());
                if (name.isNotEmpty && price != null && price > 0) {
                  setState(() {
                    _products.insert(0, {
                      'id': _products.length + 1,
                      'name': name,
                      'category': category,
                      'price': price,
                      'image': 'assets/Croissant.webp',
                      'isAvailable': isAvailable,
                    });
                  });
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Produit "$name" ajouté au catalogue avec succès !'),
                      backgroundColor: const Color(0xFF16A34A),
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: const Color(0xFFFACC15)),
              child: const Text('Créer le produit'),
            ),
          ],
        ),
      ),
    );
  }

  void _openAddEmployeeModal() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController(text: '+225 07 ');
    String selectedRole = 'Caissière';
    String selectedShift = '08:00 - 16:00';
    TimeOfDay startTime = const TimeOfDay(hour: 8, minute: 0);
    TimeOfDay endTime = const TimeOfDay(hour: 16, minute: 0);

    final shiftPresets = [
      {'label': '🌅 04:00 - 12:00', 'desc': 'Fournil Matin', 'shift': '04:00 - 12:00'},
      {'label': '☀️ 06:00 - 14:00', 'desc': 'Ouverture Vente', 'shift': '06:00 - 14:00'},
      {'label': '🕒 08:00 - 16:00', 'desc': 'Journée Standard', 'shift': '08:00 - 16:00'},
      {'label': '🌙 14:00 - 22:00', 'desc': 'Fermeture Soir', 'shift': '14:00 - 22:00'},
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          String formatTime(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            title: const Row(
              children: [
                Icon(Icons.person_add_rounded, color: Color(0xFF0F172A)),
                SizedBox(width: 10),
                Text('Ajouter un Employé', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: nameCtrl,
                    decoration: InputDecoration(
                      labelText: 'Nom et Prénom',
                      prefixIcon: const Icon(Icons.badge_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedRole,
                    decoration: InputDecoration(
                      labelText: 'Poste / Rôle',
                      prefixIcon: const Icon(Icons.work_outline),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    items: [
                      'Caissière',
                      'Maître Boulanger',
                      'Chef Pâtissière',
                      'Vendeuse Comptoir',
                      'Aide Fournil',
                      'Responsable Caisse',
                    ].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedRole = val);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Sélecteur de Plage Horaire (Shift)
                  const Text('Plage Horaire (Shift)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),

                  // Presets rapides en chips cliquables
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: shiftPresets.map((p) {
                      final isSelected = selectedShift == p['shift'];
                      return ChoiceChip(
                        label: Text(p['label']!, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.w500)),
                        selected: isSelected,
                        selectedColor: const Color(0xFFFACC15),
                        backgroundColor: const Color(0xFFF1F5F9),
                        onSelected: (selected) {
                          if (selected) {
                            setModalState(() {
                              selectedShift = p['shift']!;
                            });
                          }
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),

                  // Sélecteur d'heures personnalisées (Début ➔ Fin)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.schedule_rounded, size: 18, color: Color(0xFF0F172A)),
                            const SizedBox(width: 8),
                            Text(
                              selectedShift,
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A)),
                            ),
                          ],
                        ),
                        TextButton.icon(
                          onPressed: () async {
                            final pickedStart = await showTimePicker(
                              context: context,
                              initialTime: startTime,
                              helpText: 'HEURE DE DÉBUT DE SHIFT',
                            );
                            if (pickedStart != null) {
                              if (!ctx.mounted) return;
                              final pickedEnd = await showTimePicker(
                                context: context,
                                initialTime: endTime,
                                helpText: 'HEURE DE FIN DE SHIFT',
                              );
                              if (pickedEnd != null) {
                                setModalState(() {
                                  startTime = pickedStart;
                                  endTime = pickedEnd;
                                  selectedShift = '${formatTime(pickedStart)} - ${formatTime(pickedEnd)}';
                                });
                              }
                            }
                          },
                          icon: const Icon(Icons.edit_calendar_rounded, size: 16),
                          label: const Text('Personnaliser', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),
                  TextField(
                    controller: phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'N° Téléphone',
                      prefixIcon: const Icon(Icons.phone_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
              ElevatedButton(
                onPressed: () {
                  if (nameCtrl.text.trim().isNotEmpty) {
                    setState(() {
                      _employees.add({
                        'name': nameCtrl.text.trim(),
                        'role': selectedRole,
                        'phone': phoneCtrl.text.trim(),
                        'shift': selectedShift,
                        'status': 'En poste',
                        'active': true,
                      });
                    });
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Employé ${nameCtrl.text.trim()} ($selectedShift) ajouté au planning !'), backgroundColor: const Color(0xFF16A34A)),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: const Color(0xFFFACC15)),
                child: const Text('Ajouter'),
              ),
            ],
          );
        },
      ),
    );
  }

  int _selectedDesktopNav = 0;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth >= 850;

        if (isDesktop) {
          return Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
        body: Row(
          children: [
            // Desktop Dark Sidebar
            Container(
              width: 260,
              color: const Color(0xFF0F172A),
              child: Column(
                children: [
                  // Brand Header
                  Container(
                    padding: const EdgeInsets.fromLTRB(20, 36, 20, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFACC15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.storefront_rounded, color: Colors.black87, size: 20),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'BABI GÉRANCE',
                              style: TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1.1),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const Text('Awa Coulibaly', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        const Text('Boutique Cocody Danga', style: TextStyle(color: Colors.white60, fontSize: 12)),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFF1E293B)),

                  // Nav Items
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                      children: [
                        _buildDesktopSidebarItem(0, 'Produits & Stocks', Icons.inventory_2_rounded),
                        _buildDesktopSidebarItem(1, 'Commandes Fournil', Icons.receipt_long_rounded),
                        _buildDesktopSidebarItem(2, 'Gâteaux d\'Événements', Icons.cake_rounded),
                        _buildDesktopSidebarItem(3, 'Rapports Financiers', Icons.analytics_rounded),
                        _buildDesktopSidebarItem(4, 'Équipe Employés', Icons.badge_rounded),
                      ],
                    ),
                  ),

                  // Role Switcher button
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: ElevatedButton.icon(
                      onPressed: () => RoleSwitcherSheet.show(context, currentRole: UserAppRole.gerante),
                      icon: const Icon(Icons.swap_horiz_rounded, size: 18),
                      label: const Text('Changer de Rôle', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1E293B),
                        foregroundColor: const Color(0xFFFACC15),
                        minimumSize: const Size(double.infinity, 44),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Main Content Area
            Expanded(
              child: Scaffold(
                backgroundColor: const Color(0xFFF8FAFC),
                appBar: AppBar(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF0F172A),
                  elevation: 0,
                  title: Text(
                    _selectedDesktopNav == 0
                        ? 'Gestion du Catalogue & Disponibilités'
                        : _selectedDesktopNav == 1
                            ? 'Supervision des Commandes en Direct'
                            : _selectedDesktopNav == 2
                                ? '🎂 Réservations de Gâteaux d\'Événements'
                                : _selectedDesktopNav == 3
                                    ? 'Rapports des Ventes & Chiffre d\'Affaires'
                                    : 'Planning & Gestion des Employés',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                  ),
                ),
                body: _selectedDesktopNav == 0
                    ? _buildDesktopProductsGrid()
                    : _selectedDesktopNav == 1
                        ? _buildOrdersSupervisionTab()
                        : _selectedDesktopNav == 2
                            ? _buildEventCakesManagementTab()
                            : _selectedDesktopNav == 3
                                ? _buildReportsTab()
                                : _buildEmployeesTab(),
              ),
            ),
          ],
        ),
      );
    }

    // Mobile Layout
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.swap_horiz_rounded, color: Color(0xFFFACC15)),
          tooltip: 'Changer de rôle',
          onPressed: () => RoleSwitcherSheet.show(context, currentRole: UserAppRole.gerante),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ESPACE GÉRANTE & BOUTIQUE',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Color(0xFFFACC15)),
            ),
            Text(
              'Awa Coulibaly • Boutique Cocody Danga',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFFACC15),
          indicatorWeight: 3,
          labelColor: const Color(0xFFFACC15),
          unselectedLabelColor: Colors.white60,
          isScrollable: true,
          tabs: const [
            Tab(icon: Icon(Icons.inventory_2_outlined, size: 20), text: 'Produits'),
            Tab(icon: Icon(Icons.receipt_long_outlined, size: 20), text: 'Commandes'),
            Tab(icon: Icon(Icons.cake_outlined, size: 20), text: 'Événements'),
            Tab(icon: Icon(Icons.analytics_outlined, size: 20), text: 'Rapports'),
            Tab(icon: Icon(Icons.badge_outlined, size: 20), text: 'Employés'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildProductsTab(),
          _buildOrdersSupervisionTab(),
          _buildEventCakesManagementTab(),
          _buildReportsTab(),
          _buildEmployeesTab(),
        ],
      ),
    );
      },
    );
  }

  Widget _buildDesktopSidebarItem(int index, String title, IconData icon) {
    final isSelected = _selectedDesktopNav == index;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: Icon(icon, color: isSelected ? const Color(0xFFFACC15) : Colors.white60, size: 20),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected ? const Color(0xFFFACC15) : Colors.white70,
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w500,
            fontSize: 13,
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        tileColor: isSelected ? const Color(0xFF1E293B) : Colors.transparent,
        onTap: () => setState(() => _selectedDesktopNav = index),
      ),
    );
  }

  List<Map<String, dynamic>> get _filteredProducts {
    return _products.where((p) {
      if (_selectedCategoryFilter != 'Tous' && p['category'] != _selectedCategoryFilter) return false;
      if (_searchProductQuery.isNotEmpty) {
        final q = _searchProductQuery.toLowerCase();
        final name = (p['name'] as String).toLowerCase();
        if (!name.contains(q)) return false;
      }
      return true;
    }).toList();
  }

  // Grille multi-colonnes Desktop pour les produits
  Widget _buildDesktopProductsGrid() {
    final filtered = _filteredProducts;
    return Column(
      children: [
        // Controls Bar
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            children: [
              // Search bar
              Expanded(
                flex: 3,
                child: TextField(
                  controller: _searchProductController,
                  onChanged: (val) => setState(() => _searchProductQuery = val.trim()),
                  decoration: InputDecoration(
                    hintText: 'Rechercher un produit dans le catalogue...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchProductQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchProductController.clear();
                              setState(() => _searchProductQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Category dropdown
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedCategoryFilter,
                    items: ['Tous', 'Pains', 'Viennoiseries', 'Pâtisseries', 'Boissons', 'Salés']
                        .map((cat) => DropdownMenuItem(value: cat, child: Text(cat, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedCategoryFilter = val);
                    },
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Add Product Button
              ElevatedButton.icon(
                onPressed: _openAddProductModal,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Nouveau Produit', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: const Color(0xFFFACC15),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ),

        // Grid
        Expanded(
          child: filtered.isEmpty
              ? const Center(child: Text('Aucun produit ne correspond à la recherche'))
              : GridView.builder(
                  padding: const EdgeInsets.all(20),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 3.2,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final product = filtered[index];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [BoxShadow(color: Color(0x04000000), blurRadius: 8)],
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.asset(
                              product['image'] ?? 'assets/Croissant.webp',
                              width: 48,
                              height: 48,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const Icon(Icons.bakery_dining, size: 28),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(product['name'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                Text(product['category'] ?? '', style: const TextStyle(color: Colors.black45, fontSize: 10)),
                                const SizedBox(height: 2),
                                InkWell(
                                  onTap: () => _editProductPrice(product),
                                  child: Row(
                                    children: [
                                      Text('${(product['price'] as num).toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 12)),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.edit, size: 10, color: Color(0xFF3B82F6)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: product['isAvailable'] ?? true,
                            activeThumbColor: const Color(0xFF16A34A),
                            onChanged: (_) => _toggleProductAvailability(product),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // 1. Gestion des Produits & Stocks (Mobile)
  Widget _buildProductsTab() {
    final filtered = _filteredProducts;
    return Column(
      children: [
        // Controls Header
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchProductController,
                      onChanged: (val) => setState(() => _searchProductQuery = val.trim()),
                      decoration: InputDecoration(
                        hintText: 'Rechercher un produit...',
                        prefixIcon: const Icon(Icons.search, size: 18),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: _openAddProductModal,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Nouveau', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: const Color(0xFFFACC15),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['Tous', 'Pains', 'Viennoiseries', 'Pâtisseries', 'Boissons', 'Salés'].map((cat) {
                    final isSel = _selectedCategoryFilter == cat;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6.0),
                      child: ChoiceChip(
                        label: Text(cat, style: TextStyle(fontSize: 11, fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                        selected: isSel,
                        selectedColor: const Color(0xFF0F172A),
                        labelStyle: TextStyle(color: isSel ? const Color(0xFFFACC15) : Colors.black87),
                        onSelected: (selected) {
                          if (selected) setState(() => _selectedCategoryFilter = cat);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),

        // List
        Expanded(
          child: filtered.isEmpty
              ? const Center(child: Text('Aucun produit trouvé'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final product = filtered[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.asset(
                              product['image'] ?? 'assets/Croissant.webp',
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const Icon(Icons.bakery_dining, size: 30),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(product['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 2),
                                Text(product['category'] ?? '', style: const TextStyle(color: Colors.black45, fontSize: 11)),
                                const SizedBox(height: 4),
                                InkWell(
                                  onTap: () => _editProductPrice(product),
                                  child: Row(
                                    children: [
                                      Text('${(product['price'] as num).toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.edit, size: 12, color: Color(0xFF3B82F6)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: product['isAvailable'] ?? true,
                            activeThumbColor: const Color(0xFF16A34A),
                            onChanged: (_) => _toggleProductAvailability(product),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // 2. Supervision des Commandes Fournil en direct
  Widget _buildOrdersSupervisionTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Live banner
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'FOURNIL & CUISSON EN DIRECT',
                      style: TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_fournilOrders.where((o) => o['statusCode'] < 2).length} commandes en préparation',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {});
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Synchronisation fournil effectuée !')));
                },
                icon: const Icon(Icons.refresh, size: 15),
                label: const Text('Actualiser', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E293B),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
              ),
            ],
          ),
        ),

        ..._fournilOrders.map((order) => _buildInteractiveFournilCard(order)),
      ],
    );
  }

  Widget _buildInteractiveFournilCard(Map<String, dynamic> order) {
    final int statusCode = order['statusCode'] as int;
    Color statusColor = const Color(0xFF3B82F6);
    if (statusCode == 1) statusColor = const Color(0xFFF59E0B);
    if (statusCode == 2) statusColor = const Color(0xFF16A34A);
    if (statusCode == 3) statusColor = const Color(0xFF64748B);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: statusCode == 2 ? const Color(0xFF16A34A).withValues(alpha: 0.5) : const Color(0xFFE2E8F0)),
        boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (order['isEventCake'] == true) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.cake_rounded, size: 14, color: Color(0xFFB45309)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'COMMANDE SPÉCIALE ÉVÉNEMENT • Retrait : ${order['eventDate']}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: Color(0xFFB45309)),
                    ),
                  ),
                ],
              ),
            ),
          ],
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('#${order['id']}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              Text('${order['total']}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF0F172A))),
            ],
          ),
          const SizedBox(height: 6),
          Text('Client : ${order['client']}', style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
          Text('Contenu : ${order['items']}', style: const TextStyle(color: Colors.black54, fontSize: 12)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                child: Text(order['status'] as String, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11)),
              ),
              Text(order['payment'] as String, style: const TextStyle(color: Colors.black45, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 10),

          // Action buttons to change state
          Row(
            children: [
              if (statusCode == 0)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        order['statusCode'] = 1;
                        order['status'] = 'Au fournil (Préparation)';
                      });
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Commande #${order['id']} envoyée en cuisson fournil !')));
                    },
                    icon: const Icon(Icons.outdoor_grill_rounded, size: 16),
                    label: const Text('Passer en Cuisson Fournil ➔', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.white),
                  ),
                ),
              if (statusCode == 1)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        order['statusCode'] = 2;
                        order['status'] = 'Prête au comptoir';
                      });
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Commande #${order['id']} prête au comptoir de retrait !'), backgroundColor: const Color(0xFF16A34A)));
                    },
                    icon: const Icon(Icons.check_circle_outline, size: 16),
                    label: const Text('Marquer Prête au Comptoir ➔', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white),
                  ),
                ),
              if (statusCode == 2)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        order['statusCode'] = 3;
                        order['status'] = 'Clôturée / Remise';
                      });
                    },
                    icon: const Icon(Icons.done_all, size: 16, color: Color(0xFF64748B)),
                    label: const Text('Archiver Remise Client', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                  ),
                ),
              if (statusCode == 3)
                const Expanded(
                  child: Center(child: Text('✅ Commande terminée et archivée', style: TextStyle(color: Colors.black45, fontSize: 12, fontStyle: FontStyle.italic))),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // 3. Rapports & Statistiques Ventes
  Widget _buildReportsTab() {
    String revenueText = '184 500 FCFA';
    String waveText = '112 000 F';
    String cashText = '72 500 F';
    String ordersCount = '42';

    if (_reportPeriod == 1) {
      revenueText = '1 290 000 FCFA';
      waveText = '780 000 F';
      cashText = '510 000 F';
      ordersCount = '294';
    } else if (_reportPeriod == 2) {
      revenueText = '5 450 000 FCFA';
      waveText = '3 380 000 F';
      cashText = '2 070 000 F';
      ordersCount = '1 240';
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Period Filter Segment
        Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(14)),
          child: Row(
            children: [
              _buildPeriodTab(0, 'Aujourd\'hui'),
              _buildPeriodTab(1, '7 Derniers Jours'),
              _buildPeriodTab(2, 'Ce Mois'),
            ],
          ),
        ),

        // Big Metric Card
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(24)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('CHIFFRE D\'AFFAIRES BOUTIQUE', style: TextStyle(color: Color(0xFFFACC15), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 8),
              Text(revenueText, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              Text('Total de $ordersCount commandes enregistrées', style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 13)),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE2E8F0))),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Recettes Wave', style: TextStyle(color: Colors.black54, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text(waveText, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0284C7))),
                    const Text('61% du volume', style: TextStyle(fontSize: 11, color: Colors.black45)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE2E8F0))),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Recettes Espèces', style: TextStyle(color: Colors.black54, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text(cashText, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF16A34A))),
                    const Text('39% du volume', style: TextStyle(fontSize: 11, color: Colors.black45)),
                  ],
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 20),
        ElevatedButton.icon(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('📊 Rapport d\'activité périodique généré et envoyé pour impression !'),
                backgroundColor: Color(0xFF0F172A),
              ),
            );
          },
          icon: const Icon(Icons.download_rounded, size: 18),
          label: const Text('Télécharger / Imprimer Rapport Financier', style: TextStyle(fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0F172A),
            foregroundColor: const Color(0xFFFACC15),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
      ],
    );
  }

  Widget _buildPeriodTab(int index, String label) {
    final isSel = _reportPeriod == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _reportPeriod = index),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSel ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSel ? const [BoxShadow(color: Color(0x08000000), blurRadius: 4)] : null,
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSel ? const Color(0xFF0F172A) : Colors.black54,
                fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ),
        ),
      ),
    );
  }

  // 4. Gestion des Employés
  Widget _buildEmployeesTab() {
    return Column(
      children: [
        // Add Employee Button Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_employees.length} Membres d\'équipe', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ElevatedButton.icon(
                onPressed: _openAddEmployeeModal,
                icon: const Icon(Icons.person_add, size: 16),
                label: const Text('Ajouter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: const Color(0xFFFACC15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _employees.length,
            itemBuilder: (context, index) {
              final emp = _employees[index];
              final bool isActive = emp['active'] ?? true;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: const Color(0xFF0F172A),
                      radius: 22,
                      child: Text((emp['name'] as String)[0], style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(emp['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('${emp['role']} • ${emp['shift']}', style: const TextStyle(color: Colors.black54, fontSize: 12)),
                          if (emp['phone'] != null)
                            Text(emp['phone'] as String, style: const TextStyle(color: Colors.black45, fontSize: 11)),
                        ],
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        setState(() {
                          emp['active'] = !isActive;
                          emp['status'] = !isActive ? 'En poste' : 'En pause / Congé';
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Statut de ${emp['name']} mis à jour : ${emp['status']}')),
                        );
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isActive ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          emp['status'] as String,
                          style: TextStyle(
                            color: isActive ? const Color(0xFF15803D) : const Color(0xFFB45309),
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // 5. Gestion Complète des Gâteaux d'Événements
  Widget _buildEventCakesManagementTab() {
    final pendingCount = _eventCakeBookings.where((c) => c['statusCode'] < 3).length;
    final totalDeposit = _eventCakeBookings.fold(0, (sum, c) => sum + (c['deposit'] as int));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Summary Card
        Container(
          padding: const EdgeInsets.all(18),
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('ATELIER GÂTEAUX D\'ÉVÉNEMENTS', style: TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  Text('$pendingCount commandes en cours de confection', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text('Acomptes Wave encaissés : $totalDeposit FCFA', style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 11, fontWeight: FontWeight.w600)),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.4)),
                ),
                child: const Icon(Icons.cake_rounded, color: Color(0xFFFACC15), size: 28),
              ),
            ],
          ),
        ),

        // List of Event Cake Bookings
        ..._eventCakeBookings.map((cake) => _buildEventCakeAdminCard(cake)),
      ],
    );
  }

  Widget _buildEventCakeAdminCard(Map<String, dynamic> cake) {
    final int statusCode = cake['statusCode'] as int;
    final statusList = ['Devis Reçu', 'Acompte Validé', 'En préparation Pâtisserie', 'Prêt au Comptoir', 'Livré & Clôturé'];
    Color statusColor = const Color(0xFF3B82F6);
    if (statusCode == 1) statusColor = const Color(0xFF8B5CF6);
    if (statusCode == 2) statusColor = const Color(0xFFF59E0B);
    if (statusCode == 3) statusColor = const Color(0xFF16A34A);
    if (statusCode == 4) statusColor = const Color(0xFF64748B);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: statusCode == 2 ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0)),
        boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('#${cake['id']}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                child: Text(cake['status'] as String, style: TextStyle(color: statusColor, fontWeight: FontWeight.w900, fontSize: 11)),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Text('${cake['eventType']} • ${cake['size']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
          const SizedBox(height: 4),
          Text('Client : ${cake['client']} (${cake['phone']})', style: const TextStyle(color: Colors.black87, fontSize: 12)),
          
          const SizedBox(height: 8),
          // Calligraphy text banner
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              children: [
                const Icon(Icons.format_quote_rounded, size: 16, color: Color(0xFFB45309)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '« ${cake['customText']} »',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Color(0xFF92400E), fontStyle: FontStyle.italic),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          Text('Parfum : ${cake['flavor']}', style: const TextStyle(fontSize: 11, color: Colors.black54)),
          Text('Finition : ${cake['finish']}', style: const TextStyle(fontSize: 11, color: Colors.black54)),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('📅 Retrait : ${cake['date']} à ${cake['time']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFFDC2626))),
              Text('Total: ${(cake['total'] as int).toString()} F', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A))),
            ],
          ),
          const Divider(height: 20),

          // Action Buttons: Status stepper + WhatsApp + Print Fiche Atelier
          Row(
            children: [
              // Contact WhatsApp 1-Clic
              ElevatedButton.icon(
                onPressed: () => _contactClientWhatsApp(cake),
                icon: const Icon(Icons.chat_bubble_rounded, size: 14),
                label: const Text('WhatsApp', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF22C55E),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
              const SizedBox(width: 8),

              // Fiche Technique Fournil
              ElevatedButton.icon(
                onPressed: () => _showFicheTechniqueDialog(cake),
                icon: const Icon(Icons.print_rounded, size: 14),
                label: const Text('Fiche Atelier', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: const Color(0xFFFACC15),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
              const Spacer(),

              // Quick Status Advance Button
              if (statusCode < 4)
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      cake['statusCode'] = statusCode + 1;
                      cake['status'] = statusList[statusCode + 1];
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Statut de la commande #${cake['id']} passé à : ${statusList[statusCode + 1]}')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF1F5F9),
                    foregroundColor: const Color(0xFF0F172A),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  child: Text('Étape +1 ➔', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  void _contactClientWhatsApp(Map<String, dynamic> cake) {
    final message = '''
Bonjour ${cake['client']} !
Ici l'atelier Pâtisserie de la *Boulangerie de Babi*.
Nous avons bien enregistré votre réservation de gâteau d'événement #${cake['id']} (${cake['eventType']} - ${cake['size']}).
Retrait prévu le *${cake['date']} à ${cake['time']}*.
Tout est en ordre pour nos maîtres pâtissiers ! 🎂✨
''';
    Clipboard.setData(ClipboardData(text: message));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Message WhatsApp préparé et copié pour ${cake['client']} (${cake['phone']}) !'),
        backgroundColor: const Color(0xFF22C55E),
      ),
    );
  }

  void _showFicheTechniqueDialog(Map<String, dynamic> cake) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.print_rounded, color: Color(0xFF0F172A)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'FICHE ATELIER PÂTISSERIE • #${cake['id']}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ],
        ),
        content: Container(
          width: 340,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFAFAFA),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Center(
                child: Text(
                  'BOULANGERIE DE BABI • ATELIER PÂTISSERIE',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5),
                ),
              ),
              const Divider(height: 14),
              Text('🎂 ÉVÉNEMENT : ${cake['eventType']}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
              Text('👥 Format : ${cake['size']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(8)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('✍️ TEXTE EXACT À CALLIGRAPHIER :', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                    const SizedBox(height: 4),
                    Text('« ${cake['customText']} »', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontStyle: FontStyle.italic)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text('🍫 Parfum / Crème : ${cake['flavor']}', style: const TextStyle(fontSize: 11)),
              Text('✨ Finition Décor : ${cake['finish']}', style: const TextStyle(fontSize: 11)),
              const Divider(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('📅 Retrait : ${cake['date']} à ${cake['time']}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFDC2626), fontSize: 11)),
                  Text('Client : ${cake['client']}', style: const TextStyle(fontSize: 11)),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Fermer')),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Fiche technique envoyée à l\'imprimante de l\'atelier pâtisserie !'),
                  backgroundColor: Color(0xFF0F172A),
                ),
              );
            },
            icon: const Icon(Icons.print, size: 16),
            label: const Text('Imprimer Fiche'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: const Color(0xFFFACC15)),
          ),
        ],
      ),
    );
  }
}
