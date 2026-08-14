import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'onboarding_2_screen.dart';
import 'welcome_screen.dart';

class Onboarding3Screen extends StatefulWidget {
  const Onboarding3Screen({super.key});

  @override
  State<Onboarding3Screen> createState() => _Onboarding3ScreenState();
}

class _Onboarding3ScreenState extends State<Onboarding3Screen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _illuFadeAnim;
  late Animation<double> _illuScaleAnim;
  late Animation<Offset> _titleSlideAnim;
  late Animation<double> _titleFadeAnim;
  late Animation<double> _subFadeAnim;
  late Animation<Offset> _btnSlideAnim;
  late Animation<double> _btnFadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _illuFadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: const Interval(0.0, 0.6, curve: Curves.easeOut)),
    );
    _illuScaleAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack)),
    );

    _titleSlideAnim = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(parent: _animController, curve: const Interval(0.2, 0.7, curve: Curves.easeOutCubic)),
    );
    _titleFadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: const Interval(0.2, 0.7, curve: Curves.easeOut)),
    );

    _subFadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: const Interval(0.4, 0.85, curve: Curves.easeOut)),
    );

    _btnSlideAnim = Tween<Offset>(begin: const Offset(0, 0.4), end: Offset.zero).animate(
      CurvedAnimation(parent: _animController, curve: const Interval(0.5, 1.0, curve: Curves.easeOutCubic)),
    );
    _btnFadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: const Interval(0.5, 1.0, curve: Curves.easeOut)),
    );

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _onPrevious() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const Onboarding2Screen()),
    );
  }

  void _onStart() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const WelcomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF4B400);
    const secondaryColor = Color(0xFF1F1F1F);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            children: [
              // Top Bar with Back Action
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: _onPrevious,
                    icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF6B7280), size: 20),
                  ),
                  const SizedBox(width: 48), // Balancing spacer
                ],
              ),

              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    children: [
                      const SizedBox(height: 12),

                      // Illustration
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
                                  'assets/images/onboarding/delivery_tracking.png',
                                  width: 320,
                                  height: 320,
                                  fit: BoxFit.contain,
                                  alignment: Alignment.center,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      width: 240,
                                      height: 240,
                                      decoration: BoxDecoration(
                                        color: primaryColor.withOpacity(0.12),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.two_wheeler_rounded,
                                        size: 110,
                                        color: primaryColor,
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

                      // Title
                      AnimatedBuilder(
                        animation: _animController,
                        builder: (context, child) {
                          return FadeTransition(
                            opacity: _titleFadeAnim,
                            child: SlideTransition(
                              position: _titleSlideAnim,
                              child: Text(
                                'Suivez votre commande',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 30,
                                  fontWeight: FontWeight.w700,
                                  color: secondaryColor,
                                  height: 1.2,
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 16),

                      // Subtitle
                      AnimatedBuilder(
                        animation: _animController,
                        builder: (context, child) {
                          return FadeTransition(
                            opacity: _subFadeAnim,
                            child: Text(
                              'Recevez des notifications en temps réel et suivez votre commande jusqu\'à votre porte.',
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

              // PageIndicator (3 sur 3 -> index 2 est actif)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (index) {
                  final isActive = index == 2; // page 3 sur 3
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4.0),
                    width: isActive ? 24.0 : 8.0,
                    height: 8.0,
                    decoration: BoxDecoration(
                      color: isActive ? primaryColor : const Color(0xFFD1D5DB),
                      borderRadius: BorderRadius.circular(4.0),
                    ),
                  );
                }),
              ),

              const SizedBox(height: 28),

              // PrimaryButton ("Commencer")
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
                            onPressed: _onStart,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryColor,
                              foregroundColor: Colors.white,
                              elevation: 4,
                              shadowColor: primaryColor.withOpacity(0.4),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: Text(
                              'Commencer',
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
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
