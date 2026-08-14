import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController(text: '');
  final List<String> _recentSearches = ['Baguette Tradition', 'Pain au chocolat', 'Jus de Baobab'];
  final List<String> _popularSearches = [
    'Baguette',
    'Croissant',
    'Pain Complet',
    'Pizza',
    'Jus d\'orange',
    'Pain au chocolat',
    'Cookies',
    'Glace'
  ];

  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF4B400);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1F1F1F), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Recherche',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.mic_none_rounded, color: Color(0xFF1F1F1F)),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: Color(0xFF1F1F1F)),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar with barcode scan & clear
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    autofocus: true,
                    onChanged: (val) => setState(() => _query = val),
                    style: GoogleFonts.poppins(fontSize: 15),
                    decoration: InputDecoration(
                      hintText: 'Rechercher un produit...',
                      hintStyle: GoogleFonts.poppins(color: const Color(0xFF9CA3AF), fontSize: 14),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF6B7280)),
                      suffixIcon: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_query.isNotEmpty)
                            IconButton(
                              icon: const Icon(Icons.clear, color: Color(0xFF6B7280), size: 20),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _query = '');
                              },
                            ),
                          IconButton(
                            icon: const Icon(Icons.qr_code_scanner, color: primaryColor, size: 22),
                            onPressed: () {},
                          ),
                        ],
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: primaryColor, width: 2),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // AI Assistant Banner Hint
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [primaryColor.withOpacity(0.15), const Color(0xFFFFF3D6)],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: primaryColor.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, color: primaryColor, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'IA Assistant : "Ex : Je veux un petit-déjeuner à moins de 3000 FCFA"',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF1F1F1F),
                    ),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: _query.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16.0),
                    children: [
                      // Recent Searches
                      if (_recentSearches.isNotEmpty) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Recherches récentes',
                              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F)),
                            ),
                            TextButton(
                              onPressed: () => setState(() => _recentSearches.clear()),
                              child: Text('Effacer', style: GoogleFonts.poppins(color: Colors.red, fontSize: 13)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Column(
                          children: _recentSearches.map((item) {
                            return ListTile(
                              dense: true,
                              leading: const Icon(Icons.history, color: Color(0xFF9CA3AF), size: 20),
                              title: Text(item, style: GoogleFonts.poppins(fontSize: 14)),
                              trailing: const Icon(Icons.north_west, color: Color(0xFF9CA3AF), size: 16),
                              onTap: () {
                                _searchController.text = item;
                                setState(() => _query = item);
                              },
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Popular Searches
                      Text(
                        'Recherches populaires',
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F)),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _popularSearches.map((item) {
                          return ActionChip(
                            label: Text(item, style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF1F1F1F))),
                            backgroundColor: const Color(0xFFF3F4F6),
                            elevation: 0,
                            side: BorderSide.none,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            onPressed: () {
                              _searchController.text = item;
                              setState(() => _query = item);
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  )
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.search_off_rounded, size: 80, color: Color(0xFFD1D5DB)),
                        const SizedBox(height: 16),
                        Text(
                          'Aucun produit trouvé',
                          style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F)),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Essayez une autre recherche.',
                          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
