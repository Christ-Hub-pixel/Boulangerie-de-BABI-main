import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  final List<Map<String, dynamic>> _addresses = [
    {
      'label': 'Maison',
      'name': 'Kouassi Jean',
      'phone': '+225 07 04 38 92 01',
      'address': 'Cocody Riviera 2, Carrefour Anono, Villa 42',
      'isDefault': true,
    },
    {
      'label': 'Bureau',
      'name': 'Kouassi Jean',
      'phone': '+225 07 04 38 92 01',
      'address': 'Plateau, Immeuble CCIA, 5ème étage',
      'isDefault': false,
    },
  ];

  void _showAddAddressDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, top: 20, left: 20, right: 20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Nouvelle adresse', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(decoration: const InputDecoration(labelText: 'Nom de l\'adresse (ex: Maison, Bureau)')),
              TextField(decoration: const InputDecoration(labelText: 'Nom du destinataire')),
              TextField(decoration: const InputDecoration(labelText: 'Téléphone'), keyboardType: TextInputType.phone),
              TextField(decoration: const InputDecoration(labelText: 'Adresse complète / Quartier')),
              TextField(decoration: const InputDecoration(labelText: 'Point de repère')),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF4B400)),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Enregistrer l\'adresse', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

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
          'Mes adresses',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _addresses.length,
        itemBuilder: (context, index) {
          final addr = _addresses[index];
          final isDef = addr['isDefault'] as bool;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: primaryColor),
                        const SizedBox(width: 8),
                        Text(addr['label'], style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    if (isDef)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: primaryColor.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                        child: Text('Par défaut', style: GoogleFonts.poppins(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 11)),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('${addr['name']} (${addr['phone']})', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 13)),
                const SizedBox(height: 4),
                Text(addr['address'], style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF1F1F1F))),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: primaryColor,
        onPressed: _showAddAddressDialog,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text('Nouvelle adresse', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
