import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:babi_flutter_web/main.dart';
import 'package:babi_flutter_web/core/services/pin_code_service.dart';
import 'package:babi_flutter_web/core/services/quantum_security_service.dart';

void main() {
  group('⚛️ Tests de Sécurité Cryptographique & PIN', () {
    test('PinCodeService génère des codes PIN à 4 chiffres non triviaux', () {
      final pin = PinCodeService.generateSecurePin();
      expect(pin.length, 4);
      expect(int.tryParse(pin), isNotNull);
    });

    test('PinCodeService vérifie correctement le code PIN avec normalisation', () {
      expect(PinCodeService.verifyPin(expectedPin: '4829', enteredPin: '4829'), isTrue);
      expect(PinCodeService.verifyPin(expectedPin: '4829', enteredPin: '48 29'), isTrue);
      expect(PinCodeService.verifyPin(expectedPin: '4829', enteredPin: '0000'), isFalse);
    });

    test('QuantumSecurityService génère une empreinte numérique SHA-256 certifiée', () {
      final fingerprint = QuantumSecurityService.generateReceiptFingerprint(
        orderId: 'BAB-9842',
        totalAmount: 3500,
        pickupPin: '4829',
        timestamp: '2026-08-15T18:08:00Z',
      );
      expect(fingerprint.length, 64);
      final badge = QuantumSecurityService.formatCertifiedBadge(fingerprint);
      expect(badge.startsWith('CERT-BABI-'), isTrue);
    });
  });

  group('🍞 Tests des Widgets Principaux de la Boulangerie de BABI', () {
    testWidgets('L\'application MyApp se charge avec succès avec ProviderScope', (WidgetTester tester) async {
      await tester.pumpWidget(const ProviderScope(child: MyApp()));
      await tester.pumpAndSettle();
      expect(find.byType(MyApp), findsOneWidget);
    });
  });
}
