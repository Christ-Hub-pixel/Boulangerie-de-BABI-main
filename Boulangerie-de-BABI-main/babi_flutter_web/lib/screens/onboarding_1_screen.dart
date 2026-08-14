import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'onboarding_2_screen.dart';
import 'login_screen.dart';

class Onboarding1Screen extends StatefulWidget {
  const Onboarding1Screen({super.key});

  @override
  State<Onboarding1Screen> createState() => _Onboarding1ScreenState();
}

class _Onboarding1ScreenState extends State<Onboarding1Screen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _illuFadeAnim;
  late Animation<double> _illuScaleAnim;
  late Animation<Offset> _titleSlideAnim;
  late Animation<double> _titleFadeAnim;
  late Animation<double> _descFadeAnim;
  late Animation<Offset> _btnSlideAnim;
  late Animation<double> _btnFadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    // Illustration fadeScale
    _illuFadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );
    _illuScaleAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack),
      ),
    );

    // Title slideUp
    _titleSlideAnim = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.2, 0.7, curve: Curves.easeOutCubic),
      ),
    );
    _titleFadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.2, 0.7, curve: Curves.easeOut),
      ),
    );

    // Description fade
    _descFadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.4, 0.85, curve: Curves.easeOut),
      ),
    );

    // Primary Button slideUp
    _btnSlideAnim = Tween<Offset>(begin: const Offset(0, 0.4), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOutCubic),
      ),
    );
    _btnFadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOut),
      ),
    );

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _onSkip() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void _onNext() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const Onboarding2Screen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFDF8),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            children: [
              // Top Action: Passer
              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: _onSkip,
                  child: Text(
                    'Passer',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF6B7280),
                    ),
                  ),
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    children: [
                      const SizedBox(height: 12),

                      // Illustration (fadeScale)
                      AnimatedBuilder(
                        animation: _animController,
                        builder: (context, child) {
                          return FadeTransition(
                            opacity: _illuFadeAnim,
                            child: ScaleTransition(
                              scale: _illuScaleAnim,
                              child: Container(
                                constraints: const BoxConstraints(maxWidth: 320, maxHeight: 320),
                                child: Image.asset(
                                  'assets/images/onboarding/fresh_bread.png',
                                  width: 320,
                                  height: 320,
                                  fit: BoxFit.contain,
                                  alignment: Alignment.center,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      width: 240,
                                      height: 240,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFFF3D6),
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFFF4B400).withOpacity(0.2),
                                            blurRadius: 20,
                                            spreadRadius: 5,
                                          ),
                                        ],
                                      ),
                                      child: const Icon(
                                        Icons.bakery_dining_rounded,
                                        size: 120,
                                        color: Color(0xFFF4B400),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 32),

                      // Title (slideUp)
                      AnimatedBuilder(
                        animation: _animController,
                        builder: (context, child) {
                          return FadeTransition(
                            opacity: _titleFadeAnim,
                            child: SlideTransition(
                              position: _titleSlideAnim,
                              child: Text(
                                'Du bon pain,\nlivré chez vous',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 30,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF1A1A1A),
                                  height: 1.2,
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 16),

                      // Description (fade)
                      AnimatedBuilder(
                        animation: _animController,
                        builder: (context, child) {
                          return FadeTransition(
                            opacity: _descFadeAnim,
                            child: Text(
                              'Découvrez chaque jour des pains, viennoiseries, pâtisseries et boissons préparés avec soin, puis commandez en quelques secondes.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w400,
                                color: const Color(0xFF6B7280),
                                height: 1.6,
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Indicator (dots)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (index) {
                  final isActive = index == 0;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4.0),
                    width: isActive ? 24.0 : 8.0,
                    height: 8.0,
                    decoration: BoxDecoration(
                      color: isActive ? const Color(0xFFF4B400) : const Color(0xFFD1D5DB),
                      borderRadius: BorderRadius.circular(4.0),
                    ),
                  );
                }),
              ),

              const SizedBox(height: 28),

              // Primary Button (slideUp)
              AnimatedBuilder(
                animation: _animController,
                builder: (context, child) {
                  return FadeTransition(
                    opacity: _btnFadeAnim,
                    child: SlideTransition(
                      position: _btnSlideAnim,
                      child: FractionallySizedBox(
                        widthFactor: 0.9,
                        child: SizedBox(
                          height: 58,
                          child: ElevatedButton(
                            onPressed: _onNext,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFF4B400),
                              foregroundColor: const Color(0xFFFFFFFF),
                              elevation: 4,
                              shadowColor: const Color(0xFFF4B400).withOpacity(0.4),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Suivant',
                                  style: GoogleFonts.poppins(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(
                                  Icons.arrow_forward,
                                  color: Colors.white,
                                  size: 22,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
