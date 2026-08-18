import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color primary = Color(0xFFFB923C);
  static const Color primaryDark = Color(0xFFEA580C);
  static const Color secondary = Color(0xFF2B160C);
  static const Color darkBackground = Color(0xFF1C0D06);
  static const Color creamBackground = Color(0xFFFFFDF9);
  static const Color cardSurface = Colors.white;
  static const Color cardBorder = Color(0xFFF1E9DF);

  static const Color emeraldFresh = Color(0xFF22C55E);
  static const Color rubyHot = Color(0xFFE11D48);
  static const Color cyanCyber = Color(0xFF06B6D4);
  static const Color goldAccent = Color(0xFFF59E0B);
  static const Color textDark = Color(0xFF1C0D06);
  static const Color textMuted = Color(0xFF786C65);
  static const Color textLight = Color(0xFFFFFDF9);

  static const Color waveBlue = Color(0xFF1EA4E8);
  static const Color orangeMoney = Color(0xFFFF7900);
  static const Color mtnYellow = Color(0xFFFFCC00);
  static const Color moovGreen = Color(0xFF009639);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.creamBackground,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.cardSurface,
      ),
      textTheme: GoogleFonts.poppinsTextTheme(),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.secondary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
    );
  }
}
