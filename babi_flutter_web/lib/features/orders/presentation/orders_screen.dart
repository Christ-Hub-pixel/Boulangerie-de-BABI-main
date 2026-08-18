import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/custom_bottom_nav_bar.dart';
import 'receipt_screen.dart';
import 'order_tracking_screen.dart';
import 'product_review_sheet.dart';
import '../domain/order_item_snapshot.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        image: DecorationImage(
          image: AssetImage('assets/fond arriere d ecran de commande.webp'),
          fit: BoxFit.cover,
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Mes Commandes', style: TextStyle(fontWeight: FontWeight.bold)),
          centerTitle: true,
          backgroundColor: Colors.transparent,
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: Colors.black,
            labelColor: Colors.black,
            unselectedLabelColor: Colors.black54,
            indicatorWeight: 3,
            tabs: const [
              Tab(text: 'En cours (1)'),
              Tab(text: 'Historique'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildActiveOrders(),
            _buildPastOrders(),
          ],
        ),
        bottomNavigationBar: const CustomBottomNavBar(activeIndex: 3),
      ),
    );
  }

  Widget _buildActiveOrders() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildOrderCard(
          context: context,
          orderId: 'BAB-9842',
          date: 'Aujourd\'hui, 16:45',
          total: 8500,
          status: 'En préparation au fournil',
          items: '2x Croissant Beurre, 1x Baguette Tradition, 1x Gâteau Chocolat',
          statusColor: const Color(0xFFEAB308),
          isActive: true,
        ),
      ],
    );
  }

  Widget _buildPastOrders() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildOrderCard(
          context: context,
          orderId: 'BAB-9412',
          date: 'Hier, 14:15',
          total: 4500,
          status: 'Récupérée au comptoir',
          items: '1x Gâteau Forêt Noire, 1x Jus de Bissap',
          statusColor: const Color(0xFF22C55E),
          isActive: false,
        ),
        _buildOrderCard(
          context: context,
          orderId: 'BAB-8920',
          date: '10 Août, 09:30',
          total: 2400,
          status: 'Récupérée au comptoir',
          items: '4x Pain au chocolat, 2x Baguette',
          statusColor: const Color(0xFF22C55E),
          isActive: false,
        ),
      ],
    );
  }

  Widget _buildOrderCard({
    required BuildContext context,
    required String orderId,
    required String date,
    required double total,
    required String status,
    required String items,
    required Color statusColor,
    required bool isActive,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('#$orderId', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status,
                  style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(date, style: const TextStyle(color: Colors.black54, fontSize: 12)),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10.0),
            child: Divider(height: 1, color: Colors.black12),
          ),
          Text(items, style: const TextStyle(color: Colors.black87, fontSize: 13, height: 1.3)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total payé', style: TextStyle(color: Colors.black54, fontSize: 13)),
              Text(
                '${total.toInt()} FCFA',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.black87),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Action buttons
          Row(
            children: [
              if (isActive)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => OrderTrackingScreen(
                            orderId: orderId,
                            totalAmount: total,
                            paymentMethod: 'Wave',
                            currentStep: 2,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.location_on, size: 16, color: Colors.black87),
                    label: const Text('Suivre en direct', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFACC15),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              if (!isActive) ...[
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      final itemSnapshots = items.split(',').map((e) {
                        final trimmed = e.trim();
                        final match = RegExp(r'^(\d+)x\s*(.*)$').firstMatch(trimmed);
                        if (match != null) {
                          final qty = int.tryParse(match.group(1)!) ?? 1;
                          final name = match.group(2)!;
                          return OrderItemSnapshot(
                            productName: name,
                            unitPrice: total / (qty > 0 ? qty : 1),
                            quantity: qty,
                          );
                        }
                        return OrderItemSnapshot(productName: trimmed, unitPrice: total, quantity: 1);
                      }).toList();

                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ReceiptScreen(
                            orderId: orderId,
                            date: date,
                            items: itemSnapshots,
                            customTotal: total,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.receipt_long, size: 16, color: Colors.black87),
                    label: const Text('Reçu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.black26),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final productList = items.split(',').map((e) => e.replaceAll(RegExp(r'^\s*\d+x\s*'), '').trim()).toList();
                      ProductReviewSheet.show(context, orderId: orderId, productNames: productList);
                    },
                    icon: const Icon(Icons.star_rounded, size: 16, color: Colors.black87),
                    label: const Text('Avis (+20 pts)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFACC15),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
