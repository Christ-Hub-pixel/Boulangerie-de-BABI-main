import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'onboarding_1_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.dark);

    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _animationController.forward();

    Timer(const Duration(milliseconds: 3000), () {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 500),
          pageBuilder: (context, animation, secondaryAnimation) => const Onboarding1Screen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      );
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF4B400),
              Color(0xFFFFF8E6),
            ],
          ),
        ),
        child: Stack(
          children: [
            // Decorations: Wheat bottom_left
            Positioned(
              bottom: -20,
              left: -20,
              child: Opacity(
                opacity: 0.08,
                child: Image.asset(
                  'assets/decorations/wheat.png',
                  width: 150,
                  height: 150,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(),
                ),
              ),
            ),
            // Decorations: Wheat top_right
            Positioned(
              top: -20,
              right: -20,
              child: Opacity(
                opacity: 0.08,
                child: Transform.flip(
                  flipX: true,
                  child: Image.asset(
                    'assets/decorations/wheat.png',
                    width: 150,
                    height: 150,
                    errorBuilder: (context, error, stackTrace) => const SizedBox(),
                  ),
                ),
              ),
            ),
            
            // Main Content
            SafeArea(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),
                  // Logo with scale_fade animation
                  AnimatedBuilder(
                    animation: _animationController,
                    builder: (context, child) {
                      return Opacity(
                        opacity: _fadeAnimation.value,
                        child: Transform.scale(
                          scale: _scaleAnimation.value,
                          child: Image.asset(
                            'assets/logo/bdb_logo.png',
                            width: 180,
                            height: 180,
                            errorBuilder: (context, error, stackTrace) {
                              return const Icon(Icons.bakery_dining, size: 180, color: Color(0xFF1F1F1F));
                            },
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Title
                  Text(
                    'Boulangerie de Babi',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1F1F1F),
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Subtitle
                  Text(
                    'Le pain de Babi',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF5C4033),
                    ),
                  ),
                  const SizedBox(height: 48),
                  
                  // Loader
                  const SizedBox(
                    width: 32,
                    height: 32,
                    child: CircularProgressIndicator(
                      color: Color(0xFF1F1F1F),
                      strokeWidth: 3,
                    ),
                  ),
                  const Spacer(),
                  
                  // Footer
                  Text(
                    '© 2026 Boulangerie de Babi',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: const Color(0xFF777777),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
