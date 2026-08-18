import 'package:flutter/material.dart';

// Helper widget to generate a generic placeholder screen
class _PlaceholderScreen extends StatelessWidget {
  final String title;
  final IconData icon;

  const _PlaceholderScreen({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEFDF9),
      appBar: AppBar(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: const Color(0xFFFEFDF9),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF9E6),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.3), width: 2),
              ),
              child: Icon(icon, size: 64, color: const Color(0xFFFACC15)),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            const Text(
              'Cette page est en cours de construction.',
              style: TextStyle(color: Colors.black54, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}

class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});
  @override Widget build(BuildContext context) => const _PlaceholderScreen(title: 'Informations personnelles', icon: Icons.person_outline);
}

class AddressesScreen extends StatelessWidget {
  const AddressesScreen({super.key});
  @override Widget build(BuildContext context) => const _PlaceholderScreen(title: 'Mes adresses', icon: Icons.location_on_outlined);
}

class PaymentsScreen extends StatelessWidget {
  const PaymentsScreen({super.key});
  @override Widget build(BuildContext context) => const _PlaceholderScreen(title: 'Moyens de paiement', icon: Icons.payment_outlined);
}

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});
  @override Widget build(BuildContext context) => const _PlaceholderScreen(title: 'Mes favoris', icon: Icons.favorite_border_outlined);
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override Widget build(BuildContext context) => const _PlaceholderScreen(title: 'Paramètres', icon: Icons.settings_outlined);
}

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});
  @override Widget build(BuildContext context) => const _PlaceholderScreen(title: 'Centre d\'aide', icon: Icons.help_outline);
}

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEFDF9),
      appBar: AppBar(
        title: const Text('Nous contacter', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: const Color(0xFFFEFDF9),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF9E6),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.3), width: 2),
              ),
              child: const Icon(Icons.support_agent_outlined, size: 80, color: Color(0xFFFACC15)),
            ),
            const SizedBox(height: 32),
            const Text(
              'Besoin d\'aide ?',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 16),
            const Text(
              'Notre service client est à votre disposition pour toute question concernant votre commande.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.black54, fontSize: 16, height: 1.5),
            ),
            const SizedBox(height: 40),
            _buildContactCard(
              icon: Icons.phone_outlined,
              title: 'Téléphone (Ligne 1)',
              subtitle: '27 22 56 41 23',
            ),
            const SizedBox(height: 16),
            _buildContactCard(
              icon: Icons.phone_android_outlined,
              title: 'Mobile (Ligne 2)',
              subtitle: '07 04 38 92 01',
            ),
            const SizedBox(height: 16),
            _buildContactCard(
              icon: Icons.phone_android_outlined,
              title: 'Mobile (Ligne 3)',
              subtitle: '07 06 81 79 77',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard({required IconData icon, required String title, required String subtitle}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 15,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF9E6),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: const Color(0xFFFACC15), size: 28),
        ),
        title: Text(title, style: const TextStyle(color: Colors.black54, fontSize: 14)),
        subtitle: Text(
          subtitle,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.black87),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, color: Colors.black26, size: 16),
        onTap: () {
          // Future: Add launchUrl for tel: schema
        },
      ),
    );
  }
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override Widget build(BuildContext context) => const _PlaceholderScreen(title: 'À propos de l\'application', icon: Icons.info_outline);
}

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});
  @override Widget build(BuildContext context) => const _PlaceholderScreen(title: 'Conditions générales', icon: Icons.description_outlined);
}
