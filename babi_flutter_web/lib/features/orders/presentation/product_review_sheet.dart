import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ProductReviewSheet extends StatefulWidget {
  final String orderId;
  final List<String> productNames;

  const ProductReviewSheet({
    super.key,
    this.orderId = 'BAB-9842',
    this.productNames = const ['Croissant Pur Beurre', 'Pain au Chocolat', 'Baguette Dorée'],
  });

  static Future<void> show(
    BuildContext context, {
    String orderId = 'BAB-9842',
    List<String> productNames = const ['Croissant Pur Beurre', 'Pain au Chocolat', 'Baguette Dorée'],
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ProductReviewSheet(
        orderId: orderId,
        productNames: productNames,
      ),
    );
  }

  @override
  State<ProductReviewSheet> createState() => _ProductReviewSheetState();
}

class _ProductReviewSheetState extends State<ProductReviewSheet> {
  final Map<String, int> _ratings = {};
  final Set<String> _selectedTags = {};
  final TextEditingController _commentController = TextEditingController();
  bool _isSubmitting = false;

  final List<String> _tags = [
    '🥖 Croustillant',
    '🔥 Bien chaud',
    '😋 Très savoureux',
    '🥐 Moelleux',
    '⚡ Retrait rapide',
    '👩‍🍳 Accueil chaleureux',
  ];

  @override
  void initState() {
    super.initState();
    for (var name in widget.productNames) {
      _ratings[name] = 5;
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(milliseconds: 700));

    if (!mounted) return;
    setState(() => _isSubmitting = false);
    Navigator.pop(context);

    // Show Celebration Dialog
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFFFFFBEB),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.stars_rounded, color: Color(0xFFF59E0B), size: 54),
              ),
              const SizedBox(height: 18),
              const Text(
                'Merci pour votre avis ! 🎉',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.black87),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Votre retour aide nos maîtres boulangers à perfectionner leurs recettes au quotidien.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.card_giftcard, color: Color(0xFF16A34A), size: 20),
                    SizedBox(width: 8),
                    Text(
                      '+20 Points BABI VIP crédités 👑',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF15803D), fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFACC15),
                  foregroundColor: Colors.black87,
                  minimumSize: const Size(double.infinity, 46),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Super, merci !', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFFBEB),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.rate_review_rounded, color: Color(0xFFCA8A04), size: 22),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Votre avis sur vos produits',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Colors.black87),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.black54),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Commande #${widget.orderId} • Récupérée au comptoir',
              style: const TextStyle(fontSize: 12, color: Colors.black45),
            ),
            const SizedBox(height: 16),

            // Rating per product
            ...widget.productNames.map((name) {
              final currentRating = _ratings[name] ?? 5;
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.bakery_dining, color: Color(0xFFCA8A04), size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: List.generate(5, (index) {
                              final star = index + 1;
                              return InkWell(
                                onTap: () {
                                  setState(() => _ratings[name] = star);
                                  HapticFeedback.selectionClick();
                                },
                                child: Padding(
                                  padding: const EdgeInsets.only(right: 4),
                                  child: Icon(
                                    star <= currentRating ? Icons.star_rounded : Icons.star_outline_rounded,
                                    color: const Color(0xFFF59E0B),
                                    size: 22,
                                  ),
                                ),
                              );
                            }),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
            const SizedBox(height: 10),

            // Quick criteria tags
            const Text(
              'Qu\'avez-vous le plus apprécié ?',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _tags.map((tag) {
                final isSelected = _selectedTags.contains(tag);
                return InkWell(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedTags.remove(tag);
                      } else {
                        _selectedTags.add(tag);
                      }
                    });
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFFACC15) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? const Color(0xFFCA8A04) : Colors.transparent,
                      ),
                    ),
                    child: Text(
                      tag,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? Colors.black87 : Colors.black87,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Comment textfield
            const Text(
              'Un mot pour nos maîtres boulangers ? (Optionnel)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Pain très croustillant, service rapide...',
                hintStyle: const TextStyle(fontSize: 13, color: Colors.black38),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: const EdgeInsets.all(14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFFACC15), width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Submit CTA with VIP points bonus
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitReview,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black87,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.black87),
                    )
                  : const Text(
                      'Publier mon avis (+20 pts Fidélité) ✨',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
