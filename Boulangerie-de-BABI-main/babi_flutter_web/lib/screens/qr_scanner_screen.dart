import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> with SingleTickerProviderStateMixin {
  late AnimationController _scanController;

  @override
  void initState() {
    super.initState();
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _scanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF4B400);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Scanner un QR Code', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(icon: const Icon(Icons.flash_on, color: Colors.white), onPressed: () {}),
          IconButton(icon: const Icon(Icons.photo_library, color: Colors.white), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),
          Text('Scannez votre QR Code', style: GoogleFonts.poppins(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text('Placez le QR Code au centre du cadre pour continuer.', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 13)),
          const Spacer(),

          // Scanner Frame
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: primaryColor, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Stack(
                children: [
                  AnimatedBuilder(
                    animation: _scanController,
                    builder: (context, child) {
                      return Positioned(
                        top: _scanController.value * 240,
                        left: 10,
                        right: 10,
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(
                            color: primaryColor,
                            boxShadow: [BoxShadow(color: primaryColor, blurRadius: 8, spreadRadius: 2)],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          const Spacer(),

          // Supported Actions
          Wrap(
            spacing: 8,
            alignment: WrapAlignment.center,
            children: [
              _buildActionChip('Retrait de commande'),
              _buildActionChip('Validation de livraison'),
              _buildActionChip('Utiliser un coupon'),
              _buildActionChip('Points fidélité'),
            ],
          ),

          const SizedBox(height: 24),

          // Bottom Manual Code Button
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            icon: const Icon(Icons.keyboard),
            label: Text('Saisir un code manuellement', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
            onPressed: () {},
          ),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildActionChip(String label) {
    return Chip(
      backgroundColor: const Color(0xFF1F1F1F),
      label: Text(label, style: GoogleFonts.poppins(color: Colors.white, fontSize: 11)),
    );
  }
}
