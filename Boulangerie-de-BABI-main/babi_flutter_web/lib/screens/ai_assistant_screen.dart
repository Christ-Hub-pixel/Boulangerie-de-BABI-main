import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AIAssistantScreen extends StatefulWidget {
  const AIAssistantScreen({super.key});

  @override
  State<AIAssistantScreen> createState() => _AIAssistantScreenState();
}

class _AIAssistantScreenState extends State<AIAssistantScreen> {
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, String>> _messages = [
    {
      'sender': 'ai',
      'text': 'Bonjour 👋, je suis Babi AI ! Je peux vous aider à choisir vos pains chauuuud 🥖, suivre votre commande ou créer un menu selon votre budget.',
    },
  ];

  final List<Map<String, String>> _suggestions = [
    {'icon': '🥖', 'title': 'Je cherche un pain chaud'},
    {'icon': '🎂', 'title': 'Commander un gâteau'},
    {'icon': '🍕', 'title': 'Que me recommandez-vous ?'},
    {'icon': '📦', 'title': 'Où est ma commande ?'},
    {'icon': '💰', 'title': 'Je dispose de 5000 FCFA'},
  ];

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;
    setState(() {
      _messages.add({'sender': 'user', 'text': text});
      _messageController.clear();
    });

    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() {
          _messages.add({
            'sender': 'ai',
            'text': 'Excellente idée ! Nos fournées de baguette tradition sortent tout juste du four à la Riviera 2. Souhaitez-vous les ajouter à votre panier ?',
          });
        });
      }
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
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
        title: Row(
          children: [
            const CircleAvatar(
              radius: 18,
              backgroundColor: primaryColor,
              child: Icon(Icons.auto_awesome, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Assistant Babi AI', style: GoogleFonts.poppins(color: const Color(0xFF1F1F1F), fontWeight: FontWeight.bold, fontSize: 15)),
                Text('● En ligne', style: GoogleFonts.poppins(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Suggestions bar
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _suggestions.length,
              itemBuilder: (context, index) {
                final sug = _suggestions[index];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    avatar: Text(sug['icon']!),
                    label: Text(sug['title']!, style: GoogleFonts.poppins(fontSize: 12)),
                    backgroundColor: Colors.white,
                    side: BorderSide(color: primaryColor.withOpacity(0.3)),
                    onPressed: () => _sendMessage(sug['title']!),
                  ),
                );
              },
            ),
          ),

          // Messages List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg['sender'] == 'user';

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                    decoration: BoxDecoration(
                      color: isUser ? primaryColor : Colors.white,
                      borderRadius: BorderRadius.circular(16).copyWith(
                        bottomRight: isUser ? Radius.zero : const Radius.circular(16),
                        bottomLeft: !isUser ? Radius.zero : const Radius.circular(16),
                      ),
                    ),
                    child: Text(
                      msg['text']!,
                      style: GoogleFonts.poppins(
                        color: isUser ? Colors.white : const Color(0xFF1F1F1F),
                        fontSize: 14,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Input Bar
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Row(
              children: [
                IconButton(icon: const Icon(Icons.mic_none_rounded, color: primaryColor), onPressed: () {}),
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    style: GoogleFonts.poppins(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Posez votre question à Babi AI...',
                      hintStyle: GoogleFonts.poppins(color: Colors.grey, fontSize: 13),
                      border: InputBorder.none,
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send_rounded, color: primaryColor),
                  onPressed: () => _sendMessage(_messageController.text),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
