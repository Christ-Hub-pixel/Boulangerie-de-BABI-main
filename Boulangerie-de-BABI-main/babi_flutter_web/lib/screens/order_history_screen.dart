import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  String _selectedStatus = 'Toutes';

  final List<Map<String, dynamic>> _orders = [
    {
      'number': '#BABI-2026-9842',
      'date': '27 Juil 2026, 10:30',
      'status': 'En cours',
      'total': 1150,
      'items': 3,
      'statusColor': Colors.orange,
    },
    {
      'number': '#BABI-2026-8710',
      'date': '24 Juil 2026, 17:15',
      'status': 'Livrée',
      'total': 3500,
      'items': 5,
      'statusColor': Colors.green,
    },
    {
      'number': '#BABI-2026-7120',
      'date': '18 Juil 2026, 08:45',
      'status': 'Livrée',
      'total': 2000,
      'items': 2,
      'statusColor': Colors.green,
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
          'Mes commandes',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Filters
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['Toutes', 'En cours', 'Livrées', 'Annulées'].map((st) {
                  final isSel = _selectedStatus == st;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(st),
                      selected: isSel,
                      selectedColor: primaryColor,
                      backgroundColor: Colors.white,
                      labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                      onSelected: (val) => setState(() => _selectedStatus = st),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 16),

            // Orders List
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _orders.length,
              itemBuilder: (context, index) {
                final order = _orders[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(order['number'], style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 15)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: (order['statusColor'] as Color).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              order['status'],
                              style: GoogleFonts.poppins(color: order['statusColor'], fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(order['date'], style: GoogleFonts.poppins(color: Colors.grey, fontSize: 13)),
                          Text('${order['total']} FCFA (${order['items']} art.)', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton(
                            onPressed: () {},
                            child: const Text('Facture'),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
                            onPressed: () {},
                            child: const Text('Recommander', style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                    ],
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
