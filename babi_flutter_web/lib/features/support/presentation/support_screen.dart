import 'package:flutter/material.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _orderIdController = TextEditingController();
  final _messageController = TextEditingController();
  String _selectedReason = 'Préparation en retard';
  bool _isSending = false;

  final List<String> _reasons = [
    'Préparation en retard',
    'Produit manquant ou incorrect',
    'Qualité / Problème de fraîcheur',
    'Question sur un paiement (Wave / OM / MTN)',
    'Autre réclamation',
  ];

  final List<Map<String, String>> _faqItems = [
    {
      'question': 'Comment récupérer ma commande en boulangerie ?',
      'answer': 'Dès que le statut passe à "Prête au comptoir", rendez-vous au comptoir de la boulangerie et présentez votre numéro de commande (#BAB-XXXX) ou votre reçu numérique à la caissière.',
    },
    {
      'question': 'Combien de temps prend la préparation de ma commande ?',
      'answer': 'Le délai moyen est de 10 à 20 minutes selon l\'affluence au fournil. Vos viennoiseries et pains sont emballés tout chauds pour votre arrivée.',
    },
    {
      'question': 'Quels moyens de paiement acceptez-vous ?',
      'answer': 'Nous acceptons le paiement officiel Wave Mobile Money en ligne ainsi que le règlement en Espèces au comptoir lors du retrait de votre commande.',
    },
    {
      'question': 'Comment fonctionne le programme de fidélité BABI Club ?',
      'answer': 'Chaque commande de 1 000 FCFA vous rapporte 10 points BABI Club. Vous pouvez convertir vos points en réductions directes ou viennoiseries offertes.',
    },
    {
      'question': 'Vos produits contiennent-ils des allergènes ?',
      'answer': 'Nos produits de boulangerie contiennent du gluten et peuvent contenir des traces de fruits à coque, de produits laitiers et d\'œufs. N\'hésitez pas à demander conseil à notre personnel.',
    },
  ];

  @override
  void dispose() {
    _orderIdController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _submitClaim() {
    if (_messageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez détailler votre réclamation')),
      );
      return;
    }
    setState(() => _isSending = true);
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() {
          _isSending = false;
          _messageController.clear();
          _orderIdController.clear();
        });
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: Color(0xFF22C55E)),
                SizedBox(width: 8),
                Text('Réclamation reçue'),
              ],
            ),
            content: const Text(
              'Notre service client BABI a bien reçu votre message. Vous recevrez une réponse ou un appel sous 15 minutes.',
              style: TextStyle(fontSize: 14, color: Colors.black87),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Compris', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEFDF9),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFACC15),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Support & Assistance',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Quick Contact Cards
            const Text(
              'Besoin d\'aide immédiate ?',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildContactChannel(
                    icon: Icons.chat_bubble_outline_rounded,
                    color: const Color(0xFF25D366),
                    title: 'WhatsApp BABI',
                    subtitle: 'Réponse rapide',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Ouverture de WhatsApp (+225 07 12 34 56)...')),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildContactChannel(
                    icon: Icons.phone_in_talk_rounded,
                    color: const Color(0xFF0284C7),
                    title: 'Service Client',
                    subtitle: '7j/7 : 06h - 22h',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Appel du standard BABI (+225 27 22 00 00)...')),
                      );
                    },
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 28),
            
            // Claim Form Section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x08000000),
                    blurRadius: 16,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.rate_review_outlined, color: Color(0xFFCA8A04), size: 24),
                      SizedBox(width: 8),
                      Text(
                        'Déposer une réclamation',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.black87),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Motifs
                  const Text('Motif de la demande', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedReason,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFFACC15), width: 2),
                      ),
                    ),
                    items: _reasons.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 14)))).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedReason = val);
                    },
                  ),
                  const SizedBox(height: 14),
                  
                  // Numéro commande facultatif
                  const Text('N° de commande (optionnel)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _orderIdController,
                    decoration: InputDecoration(
                      hintText: 'ex: BAB-9842',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFFACC15), width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  
                  // Message
                  const Text('Votre message ou signalement', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _messageController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Expliquez-nous en quelques lignes votre souci...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFFACC15), width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  
                  ElevatedButton(
                    onPressed: _isSending ? null : _submitClaim,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFACC15),
                      foregroundColor: Colors.black87,
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: _isSending
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : const Text('Envoyer ma réclamation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 28),
            
            // Interactive FAQ Accordion
            const Text(
              'Foire Aux Questions (FAQ)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            ..._faqItems.map((item) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
                ),
                child: ExpansionTile(
                  title: Text(
                    item['question']!,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                  ),
                  iconColor: const Color(0xFFCA8A04),
                  collapsedIconColor: Colors.black54,
                  childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  children: [
                    Text(
                      item['answer']!,
                      style: const TextStyle(fontSize: 13, color: Colors.black54, height: 1.4),
                    ),
                  ],
                ),
              );
            }),
            
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildContactChannel({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 10,
              offset: Offset(0, 3),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: color.withValues(alpha: 0.12),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 11, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }
}
