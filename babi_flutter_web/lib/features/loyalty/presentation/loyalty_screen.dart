import 'package:flutter/material.dart';

class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _userPoints = 450;
  final String _userTier = 'Gourmand VIP';
  final int _nextTierPoints = 600;

  final List<Map<String, dynamic>> _rewards = [
    {
      'title': '1 Baguette Tradition Offerte',
      'cost': 150,
      'icon': Icons.bakery_dining,
      'code': 'BAGUETTE-FREE',
      'desc': 'Valable sur toutes nos baguettes artisanales au levain.',
    },
    {
      'title': 'Bon de réduction -1 000 FCFA',
      'cost': 300,
      'icon': Icons.discount_outlined,
      'code': 'BABI-1000',
      'desc': 'Valable dès 4 000 FCFA d\'achat sur toute la boutique.',
    },
    {
      'title': 'Menu Petit-Déjeuner Complet',
      'cost': 450,
      'icon': Icons.coffee_outlined,
      'code': 'PETIT-DEJ-VIP',
      'desc': '1 Café / Chocolat chaud + 2 Croissants + 1 Jus d\'orange pressé.',
    },
    {
      'title': 'Bon de réduction -2 500 FCFA',
      'cost': 750,
      'icon': Icons.card_giftcard,
      'code': 'BABI-2500',
      'desc': 'Valable dès 10 000 FCFA d\'achat en ligne ou en boutique.',
    },
  ];

  final List<Map<String, dynamic>> _history = [
    {'title': 'Commande #BAB-9842', 'date': 'Aujourd\'hui', 'points': '+45 pts', 'isPositive': true},
    {'title': 'Récompense Baguette Tradition', 'date': '12 Août', 'points': '-150 pts', 'isPositive': false},
    {'title': 'Commande #BAB-9412', 'date': '10 Août', 'points': '+60 pts', 'isPositive': true},
    {'title': 'Bonus Inscription BABI Club', 'date': '01 Août', 'points': '+100 pts', 'isPositive': true},
  ];

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

  void _redeemReward(Map<String, dynamic> reward) {
    final cost = reward['cost'] as int;
    if (_userPoints < cost) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Il vous manque ${cost - _userPoints} points pour cette récompense !'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Débloquer la récompense ?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${reward['title']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Text('Cette action utilisera $cost points BABI Club.', style: const TextStyle(color: Colors.black54)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF9E6),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFACC15)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.qr_code_2, color: Color(0xFFCA8A04)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Code promo : ${reward['code']}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF854D0E)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler', style: TextStyle(color: Colors.black54)),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _userPoints -= cost;
                _history.insert(0, {
                  'title': 'Récompense ${reward['title']}',
                  'date': 'Aujourd\'hui',
                  'points': '-$cost pts',
                  'isPositive': false,
                });
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Récompense débloquée ! Utilisez le code ${reward['code']} au panier.'),
                  backgroundColor: const Color(0xFF22C55E),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFACC15),
              foregroundColor: Colors.black87,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress = _userPoints / _nextTierPoints;

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
          'BABI Club Fidélité',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Loyalty Card Header
          Container(
            margin: const EdgeInsets.all(20),
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E1E1E), Color(0xFF333333)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFFFACC15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.star, color: Colors.black87, size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'BABI VIP CARD',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFACC15).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFACC15)),
                      ),
                      child: Text(
                        _userTier,
                        style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Animated Points Counter
                const Text('Solde de points disponibles', style: TextStyle(color: Colors.white60, fontSize: 13)),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    TweenAnimationBuilder<double>(
                      tween: Tween<double>(begin: 0, end: _userPoints.toDouble()),
                      duration: const Duration(milliseconds: 1200),
                      curve: Curves.easeOutCubic,
                      builder: (context, val, child) {
                        return Text(
                          val.toInt().toString(),
                          style: const TextStyle(
                            color: Color(0xFFFACC15),
                            fontSize: 38,
                            fontWeight: FontWeight.w900,
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 8),
                    const Text('points', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Animated Progress Bar
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0.0, end: progress.clamp(0.0, 1.0)),
                  duration: const Duration(milliseconds: 1400),
                  curve: Curves.easeOutExpo,
                  builder: (context, value, child) {
                    return ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: value,
                        backgroundColor: Colors.white12,
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFACC15)),
                        minHeight: 8,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 8),
                Text(
                  'Plus que ${_nextTierPoints - _userPoints} pts pour le statut Platine 👑',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          
          // Tabs
          TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFFFACC15),
            indicatorWeight: 3,
            labelColor: Colors.black87,
            unselectedLabelColor: Colors.black45,
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            tabs: const [
              Tab(text: 'Récompenses'),
              Tab(text: 'Historique'),
            ],
          ),
          
          // Tab Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Rewards List
                ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _rewards.length,
                  itemBuilder: (context, index) {
                    final reward = _rewards[index];
                    final cost = reward['cost'] as int;
                    final canAfford = _userPoints >= cost;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x05000000),
                            blurRadius: 10,
                            offset: Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 26,
                            backgroundColor: canAfford ? const Color(0xFFFFF9E6) : Colors.grey.shade100,
                            child: Icon(
                              reward['icon'] as IconData,
                              color: canAfford ? const Color(0xFFCA8A04) : Colors.grey,
                              size: 26,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  reward['title'] as String,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  reward['desc'] as String,
                                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF5F5F5),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '$cost pts nécessaires',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                      color: canAfford ? const Color(0xFFCA8A04) : Colors.black45,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => _redeemReward(reward),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: canAfford ? const Color(0xFFFACC15) : Colors.grey.shade200,
                              foregroundColor: canAfford ? Colors.black87 : Colors.grey,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Débloquer', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                
                // History List
                ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _history.length,
                  itemBuilder: (context, index) {
                    final h = _history[index];
                    final isPositive = h['isPositive'] as bool;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: isPositive ? Colors.green.shade50 : Colors.red.shade50,
                                child: Icon(
                                  isPositive ? Icons.add : Icons.remove,
                                  color: isPositive ? const Color(0xFF22C55E) : Colors.redAccent,
                                  size: 18,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    h['title'] as String,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                                  ),
                                  Text(
                                    h['date'] as String,
                                    style: const TextStyle(fontSize: 12, color: Colors.black45),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Text(
                            h['points'] as String,
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                              color: isPositive ? const Color(0xFF22C55E) : Colors.redAccent,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
