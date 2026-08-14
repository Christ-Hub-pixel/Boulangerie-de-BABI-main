import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomCakeBookingScreen extends StatefulWidget {
  const CustomCakeBookingScreen({super.key});

  @override
  State<CustomCakeBookingScreen> createState() => _CustomCakeBookingScreenState();
}

class _CustomCakeBookingScreenState extends State<CustomCakeBookingScreen> {
  String _selectedEvent = 'Anniversaire';
  String _selectedShape = 'Rond';
  String _selectedSize = '10 personnes';
  String _selectedFlavor = 'Chocolat';
  final TextEditingController _customTextController = TextEditingController();

  @override
  void dispose() {
    _customTextController.dispose();
    super.dispose();
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
        title: Text('Commander un gâteau 🎂', style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text('Créons votre gâteau sur mesure', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold)),
            Text('Personnalisez chaque détail selon vos envies.', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey)),
            const SizedBox(height: 20),

            // Événement
            _buildSectionTitle('Type d\'événement'),
            Wrap(
              spacing: 8,
              children: ['Anniversaire 🎂', 'Mariage 💒', 'Baptême 🕊️', 'Entreprise 🏢'].map((evt) {
                final isSel = _selectedEvent == evt;
                return ChoiceChip(
                  label: Text(evt),
                  selected: isSel,
                  selectedColor: primaryColor,
                  backgroundColor: Colors.white,
                  labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black),
                  onSelected: (val) => setState(() => _selectedEvent = evt),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Forme
            _buildSectionTitle('Forme du gâteau'),
            Wrap(
              spacing: 8,
              children: ['Rond', 'Carré', 'Cœur', 'Personnalisé'].map((sh) {
                final isSel = _selectedShape == sh;
                return ChoiceChip(
                  label: Text(sh),
                  selected: isSel,
                  selectedColor: primaryColor,
                  backgroundColor: Colors.white,
                  labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black),
                  onSelected: (val) => setState(() => _selectedShape = sh),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Taille
            _buildSectionTitle('Nombre de personnes'),
            Wrap(
              spacing: 8,
              children: ['6 pers', '10 pers', '20 pers', '30 pers', '50+ pers'].map((sz) {
                final isSel = _selectedSize == sz;
                return ChoiceChip(
                  label: Text(sz),
                  selected: isSel,
                  selectedColor: primaryColor,
                  backgroundColor: Colors.white,
                  labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black),
                  onSelected: (val) => setState(() => _selectedSize = sz),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Parfum de base
            _buildSectionTitle('Parfum de base'),
            Wrap(
              spacing: 8,
              children: ['Vanille', 'Chocolat', 'Fraise', 'Red Velvet', 'Citron'].map((flv) {
                final isSel = _selectedFlavor == flv;
                return ChoiceChip(
                  label: Text(flv),
                  selected: isSel,
                  selectedColor: primaryColor,
                  backgroundColor: Colors.white,
                  labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black),
                  onSelected: (val) => setState(() => _selectedFlavor = flv),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Message personnalisé
            _buildSectionTitle('Texte sur le gâteau'),
            TextField(
              controller: _customTextController,
              decoration: InputDecoration(
                hintText: 'Ex : Joyeux anniversaire Awa ❤️',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),

            const SizedBox(height: 24),

            // Button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: primaryColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande de devis transmise à la boulangerie !')));
                  Navigator.of(context).pop();
                },
                child: Text('Demander un devis', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F))),
    );
  }
}
