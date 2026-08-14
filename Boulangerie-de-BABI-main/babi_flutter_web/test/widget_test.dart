import 'package:flutter_test/flutter_test.dart';

import 'package:babi_flutter_web/main.dart';

void main() {
  testWidgets('BabiBakeryApp smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const BabiBakeryApp());

    // Verify that app title text appears.
    expect(find.textContaining('Boulangerie'), findsWidgets);
  });
}

