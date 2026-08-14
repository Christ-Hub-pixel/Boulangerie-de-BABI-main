import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _smsNotifications = false;
  bool _twoFactorAuth = false;

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
          'Paramètres',
          style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Compte
            _buildSectionHeader('Compte'),
            Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.person_outline),
                    title: Text('Modifier mon profil', style: GoogleFonts.poppins(fontSize: 14)),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  ),
                  ListTile(
                    leading: const Icon(Icons.lock_outline),
                    title: Text('Changer le mot de passe', style: GoogleFonts.poppins(fontSize: 14)),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  ),
                  ListTile(
                    leading: const Icon(Icons.delete_forever, color: Colors.red),
                    title: Text('Supprimer mon compte', style: GoogleFonts.poppins(fontSize: 14, color: Colors.red)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Préférences
            _buildSectionHeader('Préférences'),
            Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.language),
                    title: Text('Langue', style: GoogleFonts.poppins(fontSize: 14)),
                    trailing: Text('Français', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 13)),
                  ),
                  ListTile(
                    leading: const Icon(Icons.payments_outlined),
                    title: Text('Devise', style: GoogleFonts.poppins(fontSize: 14)),
                    trailing: Text('FCFA', style: GoogleFonts.poppins(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Notifications
            _buildSectionHeader('Notifications'),
            Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  SwitchListTile(
                    activeColor: primaryColor,
                    title: Text('Notifications Push', style: GoogleFonts.poppins(fontSize: 14)),
                    value: _pushNotifications,
                    onChanged: (val) => setState(() => _pushNotifications = val),
                  ),
                  SwitchListTile(
                    activeColor: primaryColor,
                    title: Text('Notifications Email', style: GoogleFonts.poppins(fontSize: 14)),
                    value: _emailNotifications,
                    onChanged: (val) => setState(() => _emailNotifications = val),
                  ),
                  SwitchListTile(
                    activeColor: primaryColor,
                    title: Text('Notifications SMS', style: GoogleFonts.poppins(fontSize: 14)),
                    value: _smsNotifications,
                    onChanged: (val) => setState(() => _smsNotifications = val),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Support & Version
            _buildSectionHeader('Support & Application'),
            Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.help_outline),
                    title: Text('FAQ', style: GoogleFonts.poppins(fontSize: 14)),
                  ),
                  ListTile(
                    leading: const Icon(Icons.support_agent),
                    title: Text('Contacter le support', style: GoogleFonts.poppins(fontSize: 14)),
                  ),
                  ListTile(
                    leading: const Icon(Icons.info_outline),
                    title: Text('Version de l\'application', style: GoogleFonts.poppins(fontSize: 14)),
                    trailing: Text('v1.0.0', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 13)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 6),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1F1F1F)),
        ),
      ),
    );
  }
}
