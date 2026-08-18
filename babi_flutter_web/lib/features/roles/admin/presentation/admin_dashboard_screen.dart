import 'package:flutter/material.dart';
import '../../presentation/role_switcher_sheet.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  double _platformCommissionRate = 5.0; // En %
  final TextEditingController _searchUserController = TextEditingController();
  String _searchUserQuery = '';
  String _userRoleFilter = 'Tous';

  final List<Map<String, dynamic>> _bakeries = [
    {'name': 'Boulangerie BABI Cocody Danga', 'commune': 'Cocody', 'phone': '+225 27 22 56 41', 'manager': 'Awa Coulibaly', 'status': 'Agréée & Active', 'orders': 1420, 'revenue': '4.8M F', 'isApproved': true},
    {'name': 'Boulangerie BABI Zone 4 Marcory', 'commune': 'Marcory', 'phone': '+225 27 21 35 12', 'manager': 'Serge Koffi', 'status': 'Agréée & Active', 'orders': 980, 'revenue': '3.2M F', 'isApproved': true},
    {'name': 'Boulangerie BABI Yopougon Maroc', 'commune': 'Yopougon', 'phone': '+225 27 23 44 89', 'manager': 'Adama Traoré', 'status': 'En attente de validation', 'orders': 0, 'revenue': '0 F', 'isApproved': false},
    {'name': 'Boulangerie BABI Riviera Palmeraie', 'commune': 'Cocody', 'phone': '+225 07 45 88 12', 'manager': 'Fatou Touré', 'status': 'En attente de validation', 'orders': 0, 'revenue': '0 F', 'isApproved': false},
  ];

  final List<Map<String, dynamic>> _users = [
    {'name': 'Marc Kouassi', 'role': 'Client VIP', 'email': 'marc.k@gmail.com', 'status': 'Actif'},
    {'name': 'Awa Coulibaly', 'role': 'Gérante', 'email': 'gerante@boulangeriedebabi.ci', 'status': 'Actif'},
    {'name': 'Aminata Traoré', 'role': 'Caissière', 'email': 'caissiere@boulangeriedebabi.ci', 'status': 'Actif'},
    {'name': 'Koffi Kouamé', 'role': 'Client', 'email': 'client@boulangeriedebabi.ci', 'status': 'Actif'},
    {'name': 'Mamadou Koné', 'role': 'Gérant Fournil', 'email': 'boulanger@boulangeriedebabi.ci', 'status': 'Actif'},
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
      'statusCode': 1,
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
    _searchUserController.dispose();
    super.dispose();
  }

  void _openAddBakeryModal() {
    final nameCtrl = TextEditingController();
    final communeCtrl = TextEditingController(text: 'Cocody');
    final phoneCtrl = TextEditingController(text: '+225 27 ');
    final managerCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.store_mall_directory_rounded, color: Color(0xFF0F172A)),
            SizedBox(width: 10),
            Text('Agréer une Boulangerie', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nom de l\'établissement', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: communeCtrl, decoration: const InputDecoration(labelText: 'Commune / Quartier', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: managerCtrl, decoration: const InputDecoration(labelText: 'Nom du Gérant Responsable', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Téléphone Boutique', border: OutlineInputBorder())),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.trim().isNotEmpty) {
                setState(() {
                  _bakeries.add({
                    'name': nameCtrl.text.trim(),
                    'commune': communeCtrl.text.trim(),
                    'phone': phoneCtrl.text.trim(),
                    'manager': managerCtrl.text.trim(),
                    'status': 'Agréée & Active',
                    'orders': 0,
                    'revenue': '0 F',
                    'isApproved': true,
                  });
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Boulangerie "${nameCtrl.text.trim()}" agréée avec succès !'), backgroundColor: const Color(0xFF16A34A)),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: const Color(0xFFFACC15)),
            child: const Text('Valider l\'Agrément'),
          ),
        ],
      ),
    );
  }

  void _openAddUserModal() {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    String role = 'Client';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Row(
            children: [
              Icon(Icons.person_add_rounded, color: Color(0xFF0F172A)),
              SizedBox(width: 10),
              Text('Créer un Utilisateur', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nom complet', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Adresse Email', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: role,
                decoration: const InputDecoration(labelText: 'Rôle attribué', border: OutlineInputBorder()),
                items: ['Client', 'Caissière', 'Gérante', 'Admin']
                    .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setModalState(() => role = val);
                },
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
            ElevatedButton(
              onPressed: () {
                if (nameCtrl.text.trim().isNotEmpty && emailCtrl.text.trim().isNotEmpty) {
                  setState(() {
                    _users.insert(0, {
                      'name': nameCtrl.text.trim(),
                      'role': role,
                      'email': emailCtrl.text.trim(),
                      'status': 'Actif',
                    });
                  });
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Compte ${nameCtrl.text.trim()} ($role) créé avec succès !'), backgroundColor: const Color(0xFF16A34A)),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: const Color(0xFFFACC15)),
              child: const Text('Créer'),
            ),
          ],
        ),
      ),
    );
  }

  void _editUserRole(Map<String, dynamic> user) {
    String currentRole = user['role'] as String;
    if (!['Client', 'Caissière', 'Gérante', 'Admin'].contains(currentRole)) {
      currentRole = 'Client';
    }

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text('Modifier Rôle : ${user['name']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: DropdownButtonFormField<String>(
            initialValue: currentRole,
            decoration: const InputDecoration(labelText: 'Nouveau rôle système', border: OutlineInputBorder()),
            items: ['Client', 'Caissière', 'Gérante', 'Admin']
                .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                .toList(),
            onChanged: (val) {
              if (val != null) setModalState(() => currentRole = val);
            },
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
            ElevatedButton(
              onPressed: () {
                setState(() => user['role'] = currentRole);
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${user['name']} a maintenant le rôle : $currentRole !')),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: const Color(0xFFFACC15)),
              child: const Text('Mettre à jour'),
            ),
          ],
        ),
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
            // Dark Desktop Sidebar
            Container(
              width: 270,
              color: const Color(0xFF0B0F19),
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
                                color: const Color(0xFF8B5CF6),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.admin_panel_settings_rounded, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'SUPER ADMIN',
                              style: TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1.1),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const Text('Administrateur Général', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        const Text('Boulangeries de BABI HQ', style: TextStyle(color: Colors.white60, fontSize: 12)),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFF1E293B)),

                  // Nav Items
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                      children: [
                        _buildDesktopSidebarItem(0, 'Vue Globale & KPIs', Icons.dashboard_rounded),
                        _buildDesktopSidebarItem(1, 'Boulangeries Agréées', Icons.store_mall_directory_rounded),
                        _buildDesktopSidebarItem(2, 'Gâteaux d\'Événements', Icons.cake_rounded),
                        _buildDesktopSidebarItem(3, 'Comptes Utilisateurs', Icons.group_rounded),
                        _buildDesktopSidebarItem(4, 'Paramètres Plateforme', Icons.settings_suggest_rounded),
                      ],
                    ),
                  ),

                  // Role Switcher button
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: ElevatedButton.icon(
                      onPressed: () => RoleSwitcherSheet.show(context, currentRole: UserAppRole.admin),
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
                        ? 'Tableau de Bord & Performance Multi-Boulangeries'
                        : _selectedDesktopNav == 1
                            ? 'Validation et Agrément des Boulangeries'
                            : _selectedDesktopNav == 2
                                ? '🎂 Pilotage Central des Gâteaux d\'Événements'
                                : _selectedDesktopNav == 3
                                    ? 'Gestion Centralisée des Utilisateurs'
                                    : 'Configuration Globale du Système',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                  ),
                ),
                body: _selectedDesktopNav == 0
                    ? _buildGlobalOverviewTab()
                    : _selectedDesktopNav == 1
                        ? _buildBakeriesTab()
                        : _selectedDesktopNav == 2
                            ? _buildEventCakesAdminTab()
                            : _selectedDesktopNav == 3
                                ? _buildUsersTab()
                                : _buildPlatformSettingsTab(),
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
          onPressed: () => RoleSwitcherSheet.show(context, currentRole: UserAppRole.admin),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SUPER-ADMINISTRATION PLATEFORME',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Color(0xFFFACC15)),
            ),
            Text(
              'Administrateur Général • BABI HQ',
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
            Tab(icon: Icon(Icons.dashboard_outlined, size: 20), text: 'Vue Globale'),
            Tab(icon: Icon(Icons.store_mall_directory_outlined, size: 20), text: 'Boulangeries'),
            Tab(icon: Icon(Icons.cake_outlined, size: 20), text: 'Événements'),
            Tab(icon: Icon(Icons.group_outlined, size: 20), text: 'Utilisateurs'),
            Tab(icon: Icon(Icons.settings_suggest_outlined, size: 20), text: 'Paramètres'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildGlobalOverviewTab(),
          _buildBakeriesTab(),
          _buildEventCakesAdminTab(),
          _buildUsersTab(),
          _buildPlatformSettingsTab(),
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

  // 1. Vue Globale & Statistiques
  Widget _buildGlobalOverviewTab() {
    final double calculatedCommission = (12450000 * (_platformCommissionRate / 100));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(24)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('VOLUME D\'AFFAIRES GLOBAL (MOIS EN COURS)', style: TextStyle(color: Color(0xFFFACC15), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 8),
              const Text('12 450 000 FCFA', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              Text(
                'Commissions plateforme collectées : ${calculatedCommission.toInt()} FCFA (${_platformCommissionRate.toStringAsFixed(1)}%)',
                style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            _buildStatCard('Boulangeries', '${_bakeries.where((b) => b['isApproved']).length}', Icons.store, const Color(0xFF3B82F6)),
            const SizedBox(width: 10),
            _buildStatCard('Commandes', '2 400', Icons.receipt_long, const Color(0xFF10B981)),
            const SizedBox(width: 10),
            _buildStatCard('Comptes', '${_users.length}', Icons.people, const Color(0xFFF59E0B)),
          ],
        ),
        const SizedBox(height: 20),

        // Commission live slider
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Taux de Commission Plateforme', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(10)),
                    child: Text('${_platformCommissionRate.toStringAsFixed(1)} %', style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
              Slider(
                value: _platformCommissionRate,
                min: 1.0,
                max: 15.0,
                divisions: 28,
                activeColor: const Color(0xFF0F172A),
                inactiveColor: const Color(0xFFE2E8F0),
                onChanged: (val) => setState(() => _platformCommissionRate = val),
              ),
              Text(
                'Ajustement en direct sur toutes les commandes du réseau (${calculatedCommission.toInt()} FCFA perçus)',
                style: const TextStyle(color: Colors.black54, fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String count, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE2E8F0))),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(count, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A))),
            Text(title, style: const TextStyle(color: Colors.black54, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  // 2. Valider les Boulangeries
  Widget _buildBakeriesTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_bakeries.length} Établissements Partenaires', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ElevatedButton.icon(
                onPressed: _openAddBakeryModal,
                icon: const Icon(Icons.add_business_rounded, size: 16),
                label: const Text('Agréer', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
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
            itemCount: _bakeries.length,
            itemBuilder: (context, index) {
              final b = _bakeries[index];
              final isApproved = b['isApproved'] as bool;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(b['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isApproved ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            b['status'],
                            style: TextStyle(
                              color: isApproved ? const Color(0xFF15803D) : const Color(0xFFB45309),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('Responsable : ${b['manager'] ?? 'Direction'} • Commune : ${b['commune'] ?? 'Abidjan'}', style: const TextStyle(color: Colors.black87, fontSize: 12)),
                    Text('Téléphone : ${b['phone'] ?? '+225 -- -- --'}', style: const TextStyle(color: Colors.black54, fontSize: 11)),
                    const SizedBox(height: 6),
                    Text('Activité : ${b['orders']} commandes • CA : ${b['revenue']}', style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        if (!isApproved)
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                setState(() {
                                  b['isApproved'] = true;
                                  b['status'] = 'Agréée & Active';
                                });
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${b['name']} est maintenant Agréée !'), backgroundColor: const Color(0xFF16A34A)));
                              },
                              icon: const Icon(Icons.check_circle_outline, size: 16),
                              label: const Text('Valider et Agréer'),
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white),
                            ),
                          )
                        else
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                setState(() {
                                  b['isApproved'] = false;
                                  b['status'] = 'Suspendue';
                                });
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Agrément de ${b['name']} suspendu.')));
                              },
                              icon: const Icon(Icons.pause_circle_outline, size: 16, color: Colors.redAccent),
                              label: const Text('Suspendre l\'agrément', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                            ),
                          ),
                      ],
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

  // 3. Gérer les Utilisateurs
  Widget _buildUsersTab() {
    final filteredUsers = _users.where((u) {
      if (_userRoleFilter != 'Tous' && !u['role'].contains(_userRoleFilter)) return false;
      if (_searchUserQuery.isNotEmpty) {
        final q = _searchUserQuery.toLowerCase();
        final name = (u['name'] as String).toLowerCase();
        final email = (u['email'] as String).toLowerCase();
        if (!name.contains(q) && !email.contains(q)) return false;
      }
      return true;
    }).toList();

    return Column(
      children: [
        // Controls
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchUserController,
                      onChanged: (val) => setState(() => _searchUserQuery = val.trim()),
                      decoration: InputDecoration(
                        hintText: 'Rechercher utilisateur ou email...',
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
                    onPressed: _openAddUserModal,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Nouveau', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: const Color(0xFFFACC15),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['Tous', 'Client', 'Caissière', 'Gérante', 'Admin'].map((r) {
                    final isSel = _userRoleFilter == r;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6.0),
                      child: ChoiceChip(
                        label: Text(r, style: TextStyle(fontSize: 11, fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                        selected: isSel,
                        selectedColor: const Color(0xFF0F172A),
                        labelStyle: TextStyle(color: isSel ? const Color(0xFFFACC15) : Colors.black87),
                        onSelected: (selected) {
                          if (selected) setState(() => _userRoleFilter = r);
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
          child: filteredUsers.isEmpty
              ? const Center(child: Text('Aucun utilisateur trouvé'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredUsers.length,
                  itemBuilder: (context, index) {
                    final u = filteredUsers[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
                      child: Row(
                        children: [
                          CircleAvatar(backgroundColor: const Color(0xFF0F172A), child: Text(u['name'][0], style: const TextStyle(color: Color(0xFFFACC15)))),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(u['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                Text('${u['role']} • ${u['email']}', style: const TextStyle(color: Colors.black54, fontSize: 12)),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit_outlined, color: Color(0xFF3B82F6), size: 20),
                            tooltip: 'Modifier Rôle',
                            onPressed: () => _editUserRole(u),
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

  // 4. Configuration & Paramètres
  Widget _buildPlatformSettingsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSettingTile('Passerelle Wave Marchande Chiffrée', 'https://pay.wave.com/m/M_ci_•••••••••••••• (Masqué & Chiffré)', Icons.verified_user_rounded),
        _buildSettingTile('Commission Plateforme', '${_platformCommissionRate.toStringAsFixed(1)} % par commande', Icons.percent),
        _buildSettingTile('Base de Données PostgreSQL', 'Synchronisation locale active (11 tables + Registre Merkle)', Icons.storage_rounded),
        _buildSettingTile('Sécurité & PIN de Retrait', 'PIN PBKDF2 salé à 100 000 itérations + Anti-Brute-Force', Icons.lock),
      ],
    );
  }

  Widget _buildSettingTile(String title, String value, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF0F172A), size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(color: Colors.black54, fontSize: 11)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.black26),
        ],
      ),
    );
  }

  // Onglet Central Gâteaux d'Événements (Super Admin)
  Widget _buildEventCakesAdminTab() {
    final int totalRevenue = _eventCakeBookings.fold(0, (sum, c) => sum + (c['total'] as int));
    final int totalDeposit = _eventCakeBookings.fold(0, (sum, c) => sum + (c['deposit'] as int));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // KPI Card
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
                  const Text('RÉSERVATIONS GÂTEAUX D\'ÉVÉNEMENTS', style: TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  Text('${_eventCakeBookings.length} Commandes Événements au réseau', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text('Volume Total : $totalRevenue FCFA • Acomptes Wave : $totalDeposit FCFA', style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 11, fontWeight: FontWeight.w600)),
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

        ..._eventCakeBookings.map((cake) {
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
              border: Border.all(color: const Color(0xFFE2E8F0)),
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
                Text('Client : ${cake['client']} (${cake['phone']})', style: const TextStyle(color: Colors.black87, fontSize: 12)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(8)),
                  child: Text('« ${cake['customText']} »', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Color(0xFF92400E), fontStyle: FontStyle.italic)),
                ),
                const SizedBox(height: 6),
                Text('📅 Retrait : ${cake['date']} à ${cake['time']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFFDC2626))),
                const Divider(height: 18),
                Row(
                  children: [
                    Text('Total: ${(cake['total'] as int).toString()} F', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                    const Spacer(),
                    if (statusCode < 4)
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            cake['statusCode'] = statusCode + 1;
                            cake['status'] = statusList[statusCode + 1];
                          });
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: const Color(0xFFFACC15)),
                        child: Text('Statut +1 (${statusList[statusCode + 1]})', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
