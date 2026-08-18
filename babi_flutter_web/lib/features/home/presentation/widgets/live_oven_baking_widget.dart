import 'package:flutter/material.dart';
import 'dart:async';
import '../../../../core/theme/app_theme.dart';

class LiveOvenBakingWidget extends StatefulWidget {
  const LiveOvenBakingWidget({super.key});

  @override
  State<LiveOvenBakingWidget> createState() => _LiveOvenBakingWidgetState();
}

class _LiveOvenBakingWidgetState extends State<LiveOvenBakingWidget> {
  late Timer _timer;
  int _hours = 4;
  int _minutes = 11;
  int _seconds = 12;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      setState(() {
        if (_seconds > 0) {
          _seconds--;
        } else {
          _seconds = 59;
          if (_minutes > 0) {
            _minutes--;
          } else {
            _minutes = 59;
            if (_hours > 0) {
              _hours--;
            } else {
              _hours = 4;
            }
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.secondary,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 15, offset: const Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                child: const Text('🔥 FOURNÉE DE 06H00', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 10)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.black38, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.primary.withValues(alpha: 0.4))),
                child: const Text('📍 Fournil Riviera 2', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text('Pain Chaud au Feu de Bois en Préparation', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text('Fournées : 06h • 09h • 14h • 17h • 18h', style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 11)),
          const SizedBox(height: 12),
          Row(
            children: [
              _box(_hours.toString().padLeft(2, '0'), 'H'),
              const Padding(padding: EdgeInsets.symmetric(horizontal: 4), child: Text(':', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
              _box(_minutes.toString().padLeft(2, '0'), 'M'),
              const Padding(padding: EdgeInsets.symmetric(horizontal: 4), child: Text(':', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
              _box(_seconds.toString().padLeft(2, '0'), 'S'),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(backgroundColor: AppColors.secondary, content: Text('🔔 Alerte activée pour la sortie du four !')));
                },
                icon: const Icon(Icons.notifications_active, size: 14, color: AppColors.secondary),
                label: const Text('Alerte', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _box(String val, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.primary.withValues(alpha: 0.3))),
      child: Column(children: [ Text(val, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)), Text(label, style: const TextStyle(color: Colors.white54, fontSize: 8)) ]),
    );
  }
}
