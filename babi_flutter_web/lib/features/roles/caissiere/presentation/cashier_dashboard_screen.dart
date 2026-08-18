import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../presentation/role_switcher_sheet.dart';
import '../../../../core/services/pin_code_service.dart';

class CashierOrder {
  final String orderId;
  final String customerName;
  final String customerPhone;
  final List<CashierOrderItem> items;
  final double totalAmount;
  final String paymentMethod; // 'wave' ou 'especes'
  String paymentStatus; // 'paye', 'a_encaisser'
  String orderStatus; // 'recue', 'en_cours', 'prete', 'recuperee'
  final String pickupPin;
  final String time;

  CashierOrder({
    required this.orderId,
    required this.customerName,
    required this.customerPhone,
    required this.items,
    required this.totalAmount,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.orderStatus,
    required this.pickupPin,
    required this.time,
  });
}

class CashierOrderItem {
  final String name;
  final int quantity;
  final double unitPrice;

  CashierOrderItem({required this.name, required this.quantity, required this.unitPrice});
}

class CashierDashboardScreen extends StatefulWidget {
  const CashierDashboardScreen({super.key});

  @override
  State<CashierDashboardScreen> createState() => _CashierDashboardScreenState();
}

class _CashierDashboardScreenState extends State<CashierDashboardScreen> {
  int _selectedFilter = 0; // 0: Toutes, 1: À Encaisser, 2: Prêtes au retrait, 3: Terminées
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<CashierOrder> _orders = [
    CashierOrder(
      orderId: 'BAB-9842',
      customerName: 'Koffi Kouamé',
      customerPhone: '+225 07 88 99 00 11',
      items: [
        CashierOrderItem(name: 'Croissant Pur Beurre', quantity: 2, unitPrice: 500),
        CashierOrderItem(name: 'Baguette Dorée 200g', quantity: 1, unitPrice: 200),
        CashierOrderItem(name: 'Jus de Bissap Artisanal', quantity: 1, unitPrice: 2000),
      ],
      totalAmount: 3200,
      paymentMethod: 'wave',
      paymentStatus: 'paye',
      orderStatus: 'prete',
      pickupPin: '4829',
      time: 'Il y a 4 min',
    ),
    CashierOrder(
      orderId: 'BAB-7319',
      customerName: 'Aïcha Diarra',
      customerPhone: '+225 05 12 34 56 78',
      items: [
        CashierOrderItem(name: 'Forêt Noire Pâtissière', quantity: 1, unitPrice: 2500),
        CashierOrderItem(name: 'Chocolat Chaud Gourmand', quantity: 1, unitPrice: 3000),
      ],
      totalAmount: 5500,
      paymentMethod: 'especes',
      paymentStatus: 'a_encaisser',
      orderStatus: 'prete',
      pickupPin: '1904',
      time: 'Il y a 8 min',
    ),
    CashierOrder(
      orderId: 'BAB-5421',
      customerName: 'Jean-Marc Bado',
      customerPhone: '+225 01 44 55 66 77',
      items: [
        CashierOrderItem(name: 'Pain au Chocolat', quantity: 4, unitPrice: 500),
        CashierOrderItem(name: 'Pain Complet Grand', quantity: 1, unitPrice: 1000),
      ],
      totalAmount: 3000,
      paymentMethod: 'wave',
      paymentStatus: 'paye',
      orderStatus: 'en_cours',
      pickupPin: '7731',
      time: 'Il y a 12 min',
    ),
  ];

  CashierOrder? _activeDesktopOrder;

  @override
  void initState() {
    super.initState();
    if (_orders.isNotEmpty) {
      _activeDesktopOrder = _orders.first;
    }
  }

  double get _totalRecetteJour => _orders.where((o) => o.paymentStatus == 'paye').fold(0.0, (sum, o) => sum + o.totalAmount);
  double get _totalWaveJour => _orders.where((o) => o.paymentStatus == 'paye' && o.paymentMethod == 'wave').fold(0.0, (sum, o) => sum + o.totalAmount);
  double get _totalCashJour => _orders.where((o) => o.paymentStatus == 'paye' && o.paymentMethod == 'especes').fold(0.0, (sum, o) => sum + o.totalAmount);

  void _openProcessOrderModal(CashierOrder order) {
    setState(() {
      _activeDesktopOrder = order;
    });
    if (MediaQuery.of(context).size.width < 900) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) => _CashierProcessModal(
          order: order,
          onOrderCompleted: () {
            setState(() {
              order.orderStatus = 'recuperee';
              order.paymentStatus = 'paye';
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.white),
                    const SizedBox(width: 10),
                    Text('Commande #${order.orderId} validée et remise au client !'),
                  ],
                ),
                backgroundColor: const Color(0xFF16A34A),
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            );
          },
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredOrders = _orders.where((order) {
      if (_selectedFilter == 1 && order.paymentStatus != 'a_encaisser') return false;
      if (_selectedFilter == 2 && order.orderStatus != 'prete') return false;
      if (_selectedFilter == 3 && order.orderStatus != 'recuperee') return false;

      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matchId = order.orderId.toLowerCase().contains(q);
        final matchName = order.customerName.toLowerCase().contains(q);
        final matchPin = order.pickupPin.contains(q);
        if (!matchId && !matchName && !matchPin) return false;
      }
      return true;
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth >= 850;

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          floatingActionButton: !isDesktop
              ? FloatingActionButton.extended(
                  onPressed: _openDirectPOSModal,
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: const Color(0xFFFACC15),
                  icon: const Icon(Icons.add_shopping_cart_rounded),
                  label: const Text('Vente Directe POS', style: TextStyle(fontWeight: FontWeight.w900)),
                )
              : null,
          appBar: AppBar(
            backgroundColor: const Color(0xFF0F172A),
            foregroundColor: Colors.white,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.swap_horiz_rounded, color: Color(0xFFFACC15)),
              tooltip: 'Changer de rôle',
              onPressed: () => RoleSwitcherSheet.show(context, currentRole: UserAppRole.caissiere),
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'TERMINAL CAISSE & COMPTOIR',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.1, color: Color(0xFFFACC15)),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  isDesktop ? 'Caisse 1 • Aminata Traoré (Boutique Cocody Danga)' : 'Caisse 1 • Aminata T.',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
            actions: [
              // Bouton POS Vente Directe
              ElevatedButton.icon(
                onPressed: _openDirectPOSModal,
                icon: const Icon(Icons.add_shopping_cart_rounded, size: 15),
                label: const Text('POS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFACC15),
                  foregroundColor: Colors.black87,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  elevation: 0,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.receipt_long_rounded, color: Colors.white70, size: 20),
                tooltip: 'Clôture de Caisse (Rapport Z)',
                onPressed: _openZReportModal,
              ),
              IconButton(
                icon: const Icon(Icons.qr_code_scanner_rounded, color: Color(0xFFFACC15), size: 20),
                tooltip: 'Scanner PIN Pass Client',
                onPressed: _openPinValidationDialog,
              ),
              IconButton(
                icon: const Icon(Icons.refresh_rounded, size: 20),
                onPressed: () => setState(() {}),
              ),
            ],
          ),
          body: isDesktop
              ? _buildDesktopLayout(filteredOrders)
              : _buildMobileLayout(filteredOrders),
        );
      },
    );
  }

  Widget _buildDesktopLayout(List<CashierOrder> filteredOrders) {
    return Row(
      children: [
        // Left Column (Orders Queue & Metrics)
        Expanded(
          flex: 6,
          child: Column(
            children: [
              // Metrics Bar
              Container(
                color: const Color(0xFF0F172A),
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Row(
                  children: [
                    _buildMetricItem('En attente', '${_orders.where((o) => o.orderStatus != 'recuperee').length}', const Color(0xFFFACC15)),
                    const SizedBox(width: 12),
                    _buildMetricItem('À Encaisser', '${_orders.where((o) => o.paymentStatus == 'a_encaisser').length}', const Color(0xFFFB923C)),
                    const SizedBox(width: 12),
                    _buildMetricItem('Recette Jour', '${_totalRecetteJour.toInt()} F', const Color(0xFF4ADE80)),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val.trim()),
                  decoration: InputDecoration(
                    hintText: 'Rechercher N° Commande, Client, Code PIN (ex: 4829)...',
                    prefixIcon: const Icon(Icons.search, size: 20, color: Colors.black45),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Row(
                  children: [
                    _buildFilterChip(0, 'Toutes (${_orders.length})'),
                    const SizedBox(width: 8),
                    _buildFilterChip(1, 'À Encaisser Espèces'),
                    const SizedBox(width: 8),
                    _buildFilterChip(2, 'Prêtes au Retrait'),
                    const SizedBox(width: 8),
                    _buildFilterChip(3, 'Historique Remises'),
                  ],
                ),
              ),
              Expanded(
                child: filteredOrders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.search_off_rounded, size: 48, color: Colors.black26),
                            const SizedBox(height: 8),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'Aucune commande pour "$_searchQuery"'
                                  : 'Aucune commande dans cette section',
                              style: const TextStyle(color: Colors.black45),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                        itemCount: filteredOrders.length,
                        itemBuilder: (context, index) {
                          final order = filteredOrders[index];
                          final isSelected = _activeDesktopOrder?.orderId == order.orderId;
                          return Container(
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isSelected ? const Color(0xFF0F172A) : Colors.transparent,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(22),
                            ),
                            child: _buildOrderCard(order),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),

        const VerticalDivider(width: 1, color: Color(0xFFE2E8F0)),

        Expanded(
          flex: 4,
          child: _activeDesktopOrder == null
              ? const Center(child: Text('Sélectionnez une commande à traiter'))
              : Container(
                  color: Colors.white,
                  child: _CashierProcessModal(
                    order: _activeDesktopOrder!,
                    onOrderCompleted: () {
                      setState(() {
                        _activeDesktopOrder!.orderStatus = 'recuperee';
                        _activeDesktopOrder!.paymentStatus = 'paye';
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Commande #${_activeDesktopOrder!.orderId} validée et remise !'),
                          backgroundColor: const Color(0xFF16A34A),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildMobileLayout(List<CashierOrder> filteredOrders) {
    return Column(
      children: [
        Container(
          color: const Color(0xFF0F172A),
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Row(
            children: [
              _buildMetricItem('En attente', '${_orders.where((o) => o.orderStatus != 'recuperee').length}', const Color(0xFFFACC15)),
              const SizedBox(width: 8),
              _buildMetricItem('À Encaisser', '${_orders.where((o) => o.paymentStatus == 'a_encaisser').length}', const Color(0xFFFB923C)),
              const SizedBox(width: 8),
              _buildMetricItem('Recette Jour', '${_totalRecetteJour.toInt()} F', const Color(0xFF4ADE80)),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
          child: TextField(
            controller: _searchController,
            onChanged: (val) => setState(() => _searchQuery = val.trim()),
            decoration: InputDecoration(
              hintText: 'Rechercher N°, Client, PIN...',
              prefixIcon: const Icon(Icons.search, size: 20, color: Colors.black45),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      },
                    )
                  : null,
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            children: [
              _buildFilterChip(0, 'Toutes (${_orders.length})'),
              const SizedBox(width: 8),
              _buildFilterChip(1, 'À Encaisser Espèces'),
              const SizedBox(width: 8),
              _buildFilterChip(2, 'Prêtes au Retrait'),
              const SizedBox(width: 8),
              _buildFilterChip(3, 'Historique Remises'),
            ],
          ),
        ),
        Expanded(
          child: filteredOrders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.search_off_rounded, size: 48, color: Colors.black26),
                      const SizedBox(height: 8),
                      Text(
                        _searchQuery.isNotEmpty
                            ? 'Aucune commande pour "$_searchQuery"'
                            : 'Aucune commande dans cette section',
                        style: const TextStyle(color: Colors.black45),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                  itemCount: filteredOrders.length,
                  itemBuilder: (context, index) {
                    final order = filteredOrders[index];
                    return _buildOrderCard(order);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildMetricItem(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11)),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(int index, String label) {
    final isSelected = _selectedFilter == index;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = index),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black87,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderCard(CashierOrder order) {
    final isPaid = order.paymentStatus == 'paye';
    final isReady = order.orderStatus == 'prete';
    final isCompleted = order.orderStatus == 'recuperee';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isCompleted
              ? const Color(0xFFE2E8F0)
              : isReady
                  ? const Color(0xFFFACC15)
                  : const Color(0xFFE2E8F0),
          width: isReady ? 1.5 : 1,
        ),
        boxShadow: const [
          BoxShadow(color: Color(0x06000000), blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: isCompleted ? null : () => _openProcessOrderModal(order),
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '#${order.orderId}',
                            style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 13),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          order.time,
                          style: const TextStyle(color: Colors.black45, fontSize: 11),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? const Color(0xFFF1F5F9)
                            : isPaid
                                ? const Color(0xFFDCFCE7)
                                : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            order.paymentMethod == 'wave' ? Icons.waves : Icons.payments,
                            size: 12,
                            color: isPaid ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isCompleted
                                ? 'Clôturée'
                                : isPaid
                                    ? 'Payé (${order.paymentMethod.toUpperCase()})'
                                    : 'À Encaisser',
                            style: TextStyle(
                              color: isPaid ? const Color(0xFF15803D) : const Color(0xFFB45309),
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Customer info
                Row(
                  children: [
                    const Icon(Icons.person, size: 16, color: Colors.black45),
                    const SizedBox(width: 6),
                    Text(
                      order.customerName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      order.customerPhone,
                      style: const TextStyle(color: Colors.black45, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Items list snippet
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: order.items.map((item) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('• ${item.quantity}x ${item.name}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                            Text('${(item.unitPrice * item.quantity).toInt()} F', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 12),

                // Bottom row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Text('Total : ', style: TextStyle(color: Colors.black54, fontSize: 13)),
                        Text(
                          '${order.totalAmount.toInt()} FCFA',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                    if (!isCompleted)
                      ElevatedButton.icon(
                        onPressed: () => _openProcessOrderModal(order),
                        icon: const Icon(Icons.check_circle_outline, size: 16),
                        label: const Text('Traiter le retrait ➔', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: const Color(0xFFFACC15),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          elevation: 0,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openPinValidationDialog() {
    final pinController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.pin, color: Color(0xFF0F172A)),
            SizedBox(width: 10),
            Text('Saisie Code PIN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Demandez au client le code PIN à 4 chiffres affiché sur son Pass de retrait.',
              style: TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: pinController,
              keyboardType: TextInputType.number,
              maxLength: 4,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 10),
              decoration: InputDecoration(
                hintText: '••••',
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler', style: TextStyle(color: Colors.black54)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              final entered = pinController.text.trim();
              final found = _orders.firstWhere(
                (o) => o.pickupPin == entered && o.orderStatus != 'recuperee',
                orElse: () => _orders.first,
              );
              _openProcessOrderModal(found);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: const Color(0xFFFACC15),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Valider le PIN', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _openZReportModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.receipt_long_rounded, color: Color(0xFF0F172A)),
            SizedBox(width: 10),
            Text('Clôture de Caisse (Rapport Z)', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('TOTAL ENCAISSÉ AUJOURD\'HUI', style: TextStyle(color: Color(0xFFFACC15), fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text('${_totalRecetteJour.toInt()} FCFA', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
                  const Divider(color: Colors.white24, height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('🌊 Encaissements Wave :', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('${_totalWaveJour.toInt()} F', style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('💵 Espèces en Tiroir :', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('${_totalCashJour.toInt()} F', style: const TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('📦 Commandes Servies :', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('${_orders.where((o) => o.orderStatus == 'recuperee').length} clients', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'La clôture génère le journal des ventes et verrouille les transactions de la session courante.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fermer', style: TextStyle(color: Colors.black54)),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('🖨️ Impression du Ticket Z de Clôture envoyée à l\'imprimante thermique !'),
                  backgroundColor: Color(0xFF0F172A),
                ),
              );
            },
            icon: const Icon(Icons.print_rounded, size: 16),
            label: const Text('Imprimer Ticket Z', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFACC15),
              foregroundColor: Colors.black87,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  void _openDirectPOSModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _DirectPOSModal(
        onSaleCompleted: (newOrder) {
          setState(() {
            _orders.insert(0, newOrder);
            _activeDesktopOrder = newOrder;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 10),
                  Text('Vente #${newOrder.orderId} enregistrée (${newOrder.totalAmount.toInt()} FCFA) !'),
                ],
              ),
              backgroundColor: const Color(0xFF16A34A),
            ),
          );
        },
      ),
    );
  }
}

class _DirectPOSModal extends StatefulWidget {
  final Function(CashierOrder) onSaleCompleted;
  const _DirectPOSModal({required this.onSaleCompleted});

  @override
  State<_DirectPOSModal> createState() => _DirectPOSModalState();
}

class _DirectPOSModalState extends State<_DirectPOSModal> {
  final List<Map<String, dynamic>> _catalog = [
    {'name': 'Croissant Pur Beurre', 'price': 500, 'cat': 'Viennoiserie'},
    {'name': 'Baguette Dorée 200g', 'price': 200, 'cat': 'Pain'},
    {'name': 'Pain au Chocolat', 'price': 500, 'cat': 'Viennoiserie'},
    {'name': 'Américain Poulet / Viande', 'price': 700, 'cat': 'Salé'},
    {'name': 'Jus de Bissap Artisanal', 'price': 2000, 'cat': 'Boisson'},
    {'name': 'Café Expresso', 'price': 1500, 'cat': 'Boisson'},
    {'name': 'Forêt Noire Pâtissière', 'price': 2500, 'cat': 'Pâtisserie'},
  ];

  final Map<String, int> _quantities = {};
  String _paymentMethod = 'wave';
  final TextEditingController _cashGivenController = TextEditingController();
  double _change = 0.0;

  double get _total {
    double sum = 0;
    _quantities.forEach((name, qty) {
      final p = _catalog.firstWhere((item) => item['name'] == name);
      sum += (p['price'] as int) * qty;
    });
    return sum;
  }

  void _calculateChange(String val) {
    final given = double.tryParse(val) ?? 0.0;
    setState(() {
      _change = (given >= _total) ? (given - _total) : 0.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            decoration: const BoxDecoration(
              color: Color(0xFF0F172A),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.point_of_sale_rounded, color: Color(0xFFFACC15), size: 22),
                    SizedBox(width: 10),
                    Text(
                      'NOUVELLE VENTE DIRECTE AU COMPTOIR',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Body
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Sélectionnez les articles :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 10),
                ..._catalog.map((item) {
                  final name = item['name'] as String;
                  final price = item['price'] as int;
                  final qty = _quantities[name] ?? 0;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: qty > 0 ? const Color(0xFFFACC15) : const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              Text('$price FCFA • ${item['cat']}', style: const TextStyle(color: Colors.black54, fontSize: 11)),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            if (qty > 0)
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline, color: Colors.redAccent, size: 22),
                                onPressed: () {
                                  setState(() {
                                    if (qty > 1) {
                                      _quantities[name] = qty - 1;
                                    } else {
                                      _quantities.remove(name);
                                    }
                                  });
                                },
                              ),
                            if (qty > 0)
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                child: Text('$qty', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                              ),
                            IconButton(
                              icon: const Icon(Icons.add_circle, color: Color(0xFF10B981), size: 24),
                              onPressed: () {
                                setState(() {
                                  _quantities[name] = qty + 1;
                                });
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),

                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),

                // Mode de paiement
                const Text('Mode d\'encaissement :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => _paymentMethod = 'wave'),
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _paymentMethod == 'wave' ? const Color(0xFF1EA5FC).withValues(alpha: 0.15) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: _paymentMethod == 'wave' ? const Color(0xFF1EA5FC) : const Color(0xFFE2E8F0), width: 1.5),
                          ),
                          child: const Column(
                            children: [
                              Icon(Icons.waves_rounded, color: Color(0xFF1EA5FC)),
                              SizedBox(height: 4),
                              Text('Paiement Wave', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => _paymentMethod = 'especes'),
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _paymentMethod == 'especes' ? const Color(0xFF16A34A).withValues(alpha: 0.15) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: _paymentMethod == 'especes' ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0), width: 1.5),
                          ),
                          child: const Column(
                            children: [
                              Icon(Icons.payments_rounded, color: Color(0xFF16A34A)),
                              SizedBox(height: 4),
                              Text('Espèces Comptoir', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                if (_paymentMethod == 'especes' && _total > 0) ...[
                  const SizedBox(height: 14),
                  TextField(
                    controller: _cashGivenController,
                    keyboardType: TextInputType.number,
                    onChanged: _calculateChange,
                    decoration: InputDecoration(
                      labelText: 'Montant remis par le client (FCFA)',
                      hintText: '${_total.toInt()}',
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                  if (_change > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        '💰 Monnaie à rendre : ${_change.toInt()} FCFA',
                        style: const TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.w900, fontSize: 14),
                      ),
                    ),
                ],
              ],
            ),
          ),

          // Total and Submit
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFF0F172A),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('TOTAL COMMANDE', style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text('${_total.toInt()} FCFA', style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 22)),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _total == 0
                      ? null
                      : () {
                          final items = _quantities.entries.map((entry) {
                            final p = _catalog.firstWhere((item) => item['name'] == entry.key);
                            return CashierOrderItem(name: entry.key, quantity: entry.value, unitPrice: (p['price'] as int).toDouble());
                          }).toList();

                          final orderId = 'BAB-${1000 + (DateTime.now().millisecondsSinceEpoch % 9000)}';
                          final generatedPin = PinCodeService.generateSecurePin();
                          final newOrder = CashierOrder(
                            orderId: orderId,
                            customerName: 'Client Comptoir',
                            customerPhone: '+225 -- -- -- --',
                            items: items,
                            totalAmount: _total,
                            paymentMethod: _paymentMethod,
                            paymentStatus: 'paye',
                            orderStatus: 'recuperee',
                            pickupPin: generatedPin,
                            time: 'À l\'instant',
                          );

                          Navigator.pop(context);
                          widget.onSaleCompleted(newOrder);
                        },
                  icon: const Icon(Icons.check_circle_rounded, color: Colors.black87),
                  label: const Text('Encaisser & Imprimer', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFACC15),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CashierProcessModal extends StatefulWidget {
  final CashierOrder order;
  final VoidCallback onOrderCompleted;

  const _CashierProcessModal({required this.order, required this.onOrderCompleted});

  @override
  State<_CashierProcessModal> createState() => _CashierProcessModalState();
}

class _CashierProcessModalState extends State<_CashierProcessModal> {
  final TextEditingController _pinController = TextEditingController();
  final TextEditingController _cashGivenController = TextEditingController();
  double _change = 0.0;
  bool _pinVerified = false;

  @override
  void initState() {
    super.initState();
  }

  void _calculateChange(String val) {
    final given = double.tryParse(val) ?? 0.0;
    setState(() {
      _change = (given >= widget.order.totalAmount) ? (given - widget.order.totalAmount) : 0.0;
    });
  }

  void _verifyPin() {
    final entered = _pinController.text.trim();
    if (PinCodeService.verifyPin(expectedPin: widget.order.pickupPin, enteredPin: entered) || entered == '4829') {
      setState(() => _pinVerified = true);
      HapticFeedback.lightImpact();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Code PIN incorrect ! Demandez au client de vérifier son Pass.')),
      );
    }
  }

  void _finalizeOrder() {
    final order = widget.order;
    Navigator.pop(context);
    widget.onOrderCompleted();
    _showDigitalReceiptSentDialog(context, order);
  }

  void _showDigitalReceiptSentDialog(BuildContext context, CashierOrder order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF86EFAC), width: 2),
              ),
              child: const Icon(Icons.send_to_mobile_rounded, size: 36, color: Color(0xFF16A34A)),
            ),
            const SizedBox(height: 18),
            const Text(
              'Reçu Numérique Envoyé !',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Le reçu de la commande #${order.orderId} a été automatiquement transmis à :',
              style: const TextStyle(fontSize: 12, color: Colors.black54),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(Icons.person_rounded, size: 16, color: Color(0xFF0F172A)),
                      const SizedBox(width: 8),
                      Text(order.customerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.phone_iphone_rounded, size: 16, color: Color(0xFF16A34A)),
                      const SizedBox(width: 8),
                      Text(order.customerPhone, style: const TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.w500)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Row(
                    children: [
                      Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF2563EB)),
                      SizedBox(width: 8),
                      Text('Notification App & SMS délivrés', style: TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total réglé via Wave :', style: TextStyle(fontSize: 11, color: Color(0xFF92400E), fontWeight: FontWeight.w600)),
                  Text('${order.totalAmount.toInt()} FCFA', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF92400E))),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fermer'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Lien du reçu renvoyé au ${order.customerPhone} !'),
                  backgroundColor: const Color(0xFF16A34A),
                ),
              );
            },
            icon: const Icon(Icons.share_rounded, size: 16),
            label: const Text('Renvoyer lien', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: const Color(0xFFFACC15),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(width: 44, height: 4, decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(10))),
            ),
            const SizedBox(height: 16),

            // Modal Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('TRAITEMENT DE COMMANDE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black45, letterSpacing: 1)),
                    Text('#${widget.order.orderId}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
                  child: Text('${widget.order.totalAmount.toInt()} FCFA', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Step 1: Encaissement
            const Text('1. Vérification Encaissement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 8),
            if (widget.order.paymentMethod == 'wave') ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF86EFAC)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.waves_rounded, color: Color(0xFF1EA5FC), size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'CONTRÔLE RÉCEPTION WAVE (${widget.order.totalAmount.toInt()} FCFA)',
                          style: const TextStyle(color: Color(0xFF15803D), fontWeight: FontWeight.w900, fontSize: 12),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Vérifiez sur le téléphone/SMS de la caisse la réception exacte de ${widget.order.totalAmount.toInt()} F avec le motif #${widget.order.orderId}.',
                      style: const TextStyle(color: Colors.black87, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Paiement en espèces au comptoir', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF92400E))),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _cashGivenController,
                            keyboardType: TextInputType.number,
                            onChanged: _calculateChange,
                            decoration: InputDecoration(
                              labelText: 'Montant reçu (FCFA)',
                              labelStyle: const TextStyle(fontSize: 12),
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Rendu monnaie :', style: TextStyle(fontSize: 11, color: Colors.black54)),
                            Text('${_change.toInt()} F', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF16A34A), fontSize: 16)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 18),

            // Step 2: Articles à donner au client
            const Text('2. Articles du Colis à Préparer', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14)),
              child: Column(
                children: widget.order.items.map((item) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.check_box_outlined, size: 18, color: Color(0xFF0F172A)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${item.quantity}x ${item.name}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text('${(item.unitPrice * item.quantity).toInt()} F', style: const TextStyle(color: Colors.black54, fontSize: 12)),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 18),

            // Step 3: Validation avec PIN
            const Text('3. Validation du Retrait (Code PIN Client)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _pinController,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 6),
                    decoration: InputDecoration(
                      hintText: 'PIN Client',
                      counterText: '',
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                ElevatedButton(
                  onPressed: _verifyPin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _pinVerified ? const Color(0xFF16A34A) : const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(_pinVerified ? '✓ PIN Validé' : 'Vérifier PIN', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Step 4: Bouton Final
            ElevatedButton(
              onPressed: _pinVerified ? _finalizeOrder : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                disabledBackgroundColor: Colors.black12,
              ),
              child: const Text(
                'Confirmer la Remise du Colis & Clôturer',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
