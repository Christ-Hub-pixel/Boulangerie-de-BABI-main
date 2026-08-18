import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../cart/presentation/wave_payment_flow.dart';
import '../../orders/domain/order_item_snapshot.dart';

class EventCakeBookingScreen extends StatefulWidget {
  const EventCakeBookingScreen({super.key});

  @override
  State<EventCakeBookingScreen> createState() => _EventCakeBookingScreenState();
}

class _EventCakeBookingScreenState extends State<EventCakeBookingScreen> {
  // Form state
  String _selectedEventType = '🎂 Anniversaire';
  int _selectedSizeIndex = 1;
  String _selectedFlavor = '🍫 Chocolat Valrhona & Praliné Craquant';
  String _selectedFinish = '✨ Glaçage Miroir & Décor Doré';
  final TextEditingController _customMessageController = TextEditingController(text: 'Joyeux Anniversaire !');
  final TextEditingController _specialNotesController = TextEditingController();
  final TextEditingController _customerPhoneController = TextEditingController(text: '+225 07 ');
  final TextEditingController _customerNameController = TextEditingController();
  
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 2));
  TimeOfDay _selectedTime = const TimeOfDay(hour: 15, minute: 0);
  int _selectedPaymentOption = 0; // 0: Acompte 50%, 1: Totalité 100%
  String _selectedInspirationImage = 'assets/gateau evenement.webp';

  final List<Map<String, dynamic>> _eventTypes = [
    {'title': '🎂 Anniversaire', 'icon': Icons.cake_rounded, 'badge': 'Le plus populaire'},
    {'title': '💍 Mariage & Fiançailles', 'icon': Icons.favorite_rounded, 'badge': 'Prestige'},
    {'title': '👶 Baptême & Naissance', 'icon': Icons.child_care_rounded, 'badge': 'Douceur'},
    {'title': '🏢 Événement Pro / Gala', 'icon': Icons.business_center_rounded, 'badge': 'Entreprise'},
    {'title': '🎉 Fête & Célébration', 'icon': Icons.celebration_rounded, 'badge': 'Fête'},
  ];

  final List<Map<String, dynamic>> _sizeOptions = [
    {'label': '6 - 8 parts', 'desc': 'Intime & Familial', 'price': 16000, 'img': 'assets/Gateau1.webp'},
    {'label': '10 - 14 parts', 'desc': 'Grand Anniversaire', 'price': 26000, 'img': 'assets/gateau evenement.webp'},
    {'label': '18 - 22 parts', 'desc': 'Fête & Réception', 'price': 42000, 'img': 'assets/gateau  d evenement2.webp'},
    {'label': '30 - 40 parts (2 étages)', 'desc': 'Célébration Prestige', 'price': 78000, 'img': 'assets/gateau event.webp'},
    {'label': '50+ parts (Pièce Montée)', 'desc': 'Mariage Royal & Gala', 'price': 135000, 'img': 'assets/gateau de mariiage.webp'},
  ];

  final List<String> _flavorOptions = [
    '🍫 Chocolat Valrhona & Praliné Craquant',
    '🍓 Fraisier Tradition & Crème Mousseline',
    '🥭 Mangue-Passion Tropicale d\'Abidjan',
    '🍦 Vanille Bourbon de Madagascar & Caramel Beurre Salé',
    '🍒 Forêt Noire Grand Cru & Cerises Amarena',
    '🥥 Coco Exotique & Ananas Flambé',
  ];

  final List<String> _finishOptions = [
    '✨ Glaçage Miroir & Décor Doré',
    '🌸 Fleurs Fraîches Naturelles & Macarons',
    '🍫 Drip Cake Gourmand & Coulées Chocolat',
    '🎨 Pâte à Sucre Thématique Sculptée',
    '👑 Feuille d\'Or 24K & Perles Sucrées',
    '📸 Photo Alimentaire Personnalisée Imprimée',
  ];

  final List<String> _galleryImages = [
    'assets/gateau de mariiage.webp',
    'assets/gateau evenement.webp',
    'assets/gateau  d evenement2.webp',
    'assets/gateau event.webp',
    'assets/gateau mariage.webp',
    'assets/Gateau1.webp',
  ];

  int _selectedFloors = 1; // 1, 2, 3 étages

  double get _totalPrice {
    double base = (_sizeOptions[_selectedSizeIndex]['price'] as int).toDouble();
    if (_selectedFloors == 2) base += 8000;
    if (_selectedFloors == 3) base += 18000;
    return base;
  }

  double get _amountToPayNow => _selectedPaymentOption == 0 ? _totalPrice * 0.5 : _totalPrice;

  void _openWhatsAppOrder() {
    final clientName = _customerNameController.text.trim().isEmpty ? 'Client Babi' : _customerNameController.text.trim();
    final clientPhone = _customerPhoneController.text.trim();
    final ref = 'BABI-EVT-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    final dateStr = '${_selectedDate.day.toString().padLeft(2, '0')}/${_selectedDate.month.toString().padLeft(2, '0')}/${_selectedDate.year}';
    final timeStr = '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}';

    final message = '''
🍰 *NOUVELLE DEMANDE GÂTEAU D'ÉVÉNEMENT* (#$ref)
━━━━━━━━━━━━━━━━━━━━
👤 *Client :* $clientName ($clientPhone)
🎉 *Événement :* $_selectedEventType
🎂 *Format :* ${_sizeOptions[_selectedSizeIndex]['label']} • $_selectedFloors étage(s)
🍫 *Saveur :* $_selectedFlavor
✨ *Finition :* $_selectedFinish
✍️ *Texte sur gâteau :* "${_customMessageController.text.trim()}"
📅 *Date & Heure Retrait :* $dateStr à $timeStr
💰 *Total Devis :* ${_totalPrice.toInt()} FCFA (Acompte 50% : ${(_totalPrice * 0.5).toInt()} FCFA)
━━━━━━━━━━━━━━━━━━━━
Merci de me confirmer la disponibilité des maîtres pâtissiers !
''';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.chat_bubble_rounded, color: Color(0xFF22C55E)),
            SizedBox(width: 8),
            Text('Commande WhatsApp', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Votre message pour l\'équipe pâtisserie de la Boulangerie de Babi a été préparé avec votre référence :',
              style: TextStyle(fontSize: 12, color: Colors.black87),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                message,
                style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Fermer')),
          ElevatedButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: message));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Message WhatsApp copié ! Ouverture de la discussion...'),
                  backgroundColor: Color(0xFF22C55E),
                ),
              );
            },
            icon: const Icon(Icons.send_rounded, size: 16),
            label: const Text('Envoyer sur WhatsApp'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF22C55E), foregroundColor: Colors.white),
          ),
        ],
      ),
    );
  }

  void _submitReservation() {
    if (_customerNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez renseigner votre Nom et Prénom pour la réservation.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    final orderId = 'BABI-EVT-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    WavePaymentSheet.show(
      context,
      totalAmount: _amountToPayNow,
      orderId: orderId,
      items: [
        OrderItemSnapshot(
          productName: 'Gâteau $_selectedEventType (${_sizeOptions[_selectedSizeIndex]['label']})',
          unitPrice: _totalPrice,
          quantity: 1,
        ),
      ],
    );
  }

  @override
  void dispose() {
    _customMessageController.dispose();
    _specialNotesController.dispose();
    _customerPhoneController.dispose();
    _customerNameController.dispose();
    super.dispose();
  }

  void _pickDate() async {
    final minDate = DateTime.now().add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate.isBefore(minDate) ? minDate : _selectedDate,
      firstDate: minDate,
      lastDate: DateTime.now().add(const Duration(days: 90)),
      helpText: 'DATE SOUHAITÉE DE RETRAIT AU COMPTOIR',
      confirmText: 'VALIDER LA DATE',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF0F172A),
              onPrimary: Color(0xFFFACC15),
              surface: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  void _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
      helpText: 'HEURE ESTIMÉE DE RETRAIT',
      confirmText: 'VALIDER L\'HEURE',
    );
    if (picked != null) {
      setState(() => _selectedTime = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final String formattedDate = '${_selectedDate.day.toString().padLeft(2, '0')}/${_selectedDate.month.toString().padLeft(2, '0')}/${_selectedDate.year}';
    final String formattedTime = '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}';

    return Scaffold(
      backgroundColor: const Color(0xFFFDFBF7),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Color(0xFFFACC15)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Gâteaux d\'Événements', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.white)),
            Text('Création Sur-Mesure • Boulangerie de Babi', style: TextStyle(fontSize: 11, color: Color(0xFFFACC15))),
          ],
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Banner with image carousel gallery
            Container(
              height: 220,
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    _selectedInspirationImage,
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.3),
                          Colors.black.withValues(alpha: 0.85),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFACC15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('ATELIER HAUTE PÂTISSERIE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: Color(0xFF0F172A), letterSpacing: 0.5)),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Composez Votre Gâteau d\'Exception',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20),
                        ),
                        const Text(
                          'Mariages, Anniversaires, Baptêmes & Célébrations',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Gallery Thumbnails
            Container(
              color: const Color(0xFF1E293B),
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
              child: Row(
                children: [
                  const Text('Modèles :', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _galleryImages.length,
                        itemBuilder: (context, index) {
                          final img = _galleryImages[index];
                          final isSel = _selectedInspirationImage == img;
                          return GestureDetector(
                            onTap: () => setState(() => _selectedInspirationImage = img),
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSel ? const Color(0xFFFACC15) : Colors.white24,
                                  width: isSel ? 2.5 : 1,
                                ),
                                image: DecorationImage(image: AssetImage(img), fit: BoxFit.cover),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Type d'Événement
                  _buildSectionTitle('1. Type d\'Événement', Icons.event_available_rounded),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _eventTypes.map((t) {
                      final isSelected = _selectedEventType == t['title'];
                      return ChoiceChip(
                        label: Text(t['title'] as String, style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600)),
                        selected: isSelected,
                        selectedColor: const Color(0xFFFACC15),
                        backgroundColor: Colors.white,
                        onSelected: (selected) {
                          if (selected) setState(() => _selectedEventType = t['title'] as String);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  // 2. Taille & Nombre de Parts
                  _buildSectionTitle('2. Nombre de Parts & Format', Icons.people_alt_rounded),
                  const SizedBox(height: 10),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _sizeOptions.length,
                    itemBuilder: (context, index) {
                      final size = _sizeOptions[index];
                      final isSelected = _selectedSizeIndex == index;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedSizeIndex = index),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFFFFBEB) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? const Color(0xFFFACC15) : const Color(0xFFE2E8F0),
                              width: isSelected ? 2 : 1,
                            ),
                            boxShadow: [
                              if (isSelected) BoxShadow(color: const Color(0xFFFACC15).withValues(alpha: 0.2), blurRadius: 8),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                margin: const EdgeInsets.symmetric(horizontal: 8),
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFF0F172A) : Colors.black26,
                                    width: isSelected ? 6 : 2,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(size['label'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                                    Text(size['desc'] as String, style: const TextStyle(color: Colors.black54, fontSize: 11)),
                                  ],
                                ),
                              ),
                              Text(
                                '${(size['price'] as int).toString()} F',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A)),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // 2.bis Nombre d'Étages
                  _buildSectionTitle('2.bis Nombre d\'Étages', Icons.layers_rounded),
                  const SizedBox(height: 10),
                  Row(
                    children: [1, 2, 3].map((floors) {
                      final isSelected = _selectedFloors == floors;
                      final addon = floors == 1 ? 'Inclus' : (floors == 2 ? '+8 000 F' : '+18 000 F');
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedFloors = floors),
                          child: Container(
                            margin: EdgeInsets.only(right: floors < 3 ? 8 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF0F172A) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  '$floors Étage${floors > 1 ? "s" : ""}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                    color: isSelected ? const Color(0xFFFACC15) : const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  addon,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isSelected ? Colors.white70 : Colors.black45,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  // 3. Saveurs & Parfums
                  _buildSectionTitle('3. Parfum de la Génoise & Crème', Icons.cookie_rounded),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: _selectedFlavor,
                        items: _flavorOptions.map((f) => DropdownMenuItem(value: f, child: Text(f, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedFlavor = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 4. Finition & Décoration
                  _buildSectionTitle('4. Style & Finition Décorative', Icons.brush_rounded),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: _selectedFinish,
                        items: _finishOptions.map((f) => DropdownMenuItem(value: f, child: Text(f, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedFinish = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 5. Message Personnalisé
                  _buildSectionTitle('5. Inscription sur le Gâteau (Offert)', Icons.edit_note_rounded),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _customMessageController,
                    decoration: InputDecoration(
                      hintText: 'Ex: Joyeux 30e Anniversaire Aïcha ❤️',
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: const Icon(Icons.format_quote_rounded, color: Color(0xFFFACC15)),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 6. Date et Heure de Retrait
                  _buildSectionTitle('6. Date & Heure de Retrait', Icons.event_rounded),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: _pickDate,
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_month_rounded, color: Color(0xFF0F172A), size: 20),
                                const SizedBox(width: 8),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Date de retrait', style: TextStyle(color: Colors.black45, fontSize: 10)),
                                    Text(formattedDate, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: InkWell(
                          onTap: _pickTime,
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.schedule_rounded, color: Color(0xFF0F172A), size: 20),
                                const SizedBox(width: 8),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Heure de retrait', style: TextStyle(color: Colors.black45, fontSize: 10)),
                                    Text(formattedTime, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // 7. Vos Coordonnées
                  _buildSectionTitle('7. Vos Coordonnées Client', Icons.badge_outlined),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _customerNameController,
                    decoration: InputDecoration(
                      labelText: 'Nom et Prénom *',
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: const Icon(Icons.person_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _customerPhoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Téléphone Wave (WhatsApp) *',
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: const Icon(Icons.phone_iphone_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 8. Modalités de Règlement Wave
                  _buildSectionTitle('8. Règlement Wave Mobile Money', Icons.account_balance_wallet_rounded),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedPaymentOption = 0),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: _selectedPaymentOption == 0 ? const Color(0xFFFFFBEB) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: _selectedPaymentOption == 0 ? const Color(0xFFFACC15) : const Color(0xFFE2E8F0),
                                width: _selectedPaymentOption == 0 ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              children: [
                                const Text('Acompte 50%', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                const SizedBox(height: 4),
                                Text('${(_totalPrice * 0.5).toInt()} F', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1D4ED8), fontSize: 14)),
                                const Text('Solde au retrait', style: TextStyle(fontSize: 10, color: Colors.black45)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedPaymentOption = 1),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: _selectedPaymentOption == 1 ? const Color(0xFFFFFBEB) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: _selectedPaymentOption == 1 ? const Color(0xFFFACC15) : const Color(0xFFE2E8F0),
                                width: _selectedPaymentOption == 1 ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              children: [
                                const Text('Totalité 100%', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                const SizedBox(height: 4),
                                Text('${_totalPrice.toInt()} F', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF16A34A), fontSize: 14)),
                                const Text('Tout réglé d\'avance', style: TextStyle(fontSize: 10, color: Colors.black45)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),

                  // Total & Validation Button Bar
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('TOTAL DU GÂTEAU', style: TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1)),
                                Text('Gâteau sur-mesure & Décor', style: TextStyle(color: Colors.white70, fontSize: 11)),
                              ],
                            ),
                            Text(
                              '${_totalPrice.toInt()} FCFA',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20),
                            ),
                          ],
                        ),
                        const Divider(color: Colors.white24, height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('À régler maintenant via Wave :', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            Text(
                              '${_amountToPayNow.toInt()} FCFA',
                              style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w900, fontSize: 18),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _submitReservation,
                          icon: const Icon(Icons.lock_outline_rounded, size: 18),
                          label: Text(
                            'Payer ${_amountToPayNow.toInt()} F avec Wave & Réserver',
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFACC15),
                            foregroundColor: const Color(0xFF0F172A),
                            minimumSize: const Size(double.infinity, 50),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                        ),
                        const SizedBox(height: 10),
                        OutlinedButton.icon(
                          onPressed: _openWhatsAppOrder,
                          icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18, color: Color(0xFF4ADE80)),
                          label: const Text(
                            'Commander / Devis via WhatsApp',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF4ADE80)),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF22C55E), width: 1.5),
                            minimumSize: const Size(double.infinity, 46),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: const Color(0xFF0F172A)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A)),
        ),
      ],
    );
  }
}
