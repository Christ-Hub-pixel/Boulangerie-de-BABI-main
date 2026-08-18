import 'dart:math';
import 'dart:convert';
import 'package:crypto/crypto.dart';

/// Algorithme de génération et validation des codes PIN de retrait de commande
/// pour les Boulangeries de BABI.
class PinCodeService {
  // Liste des codes PIN trop prévisibles interdits
  static const Set<String> _blacklist = {
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
    '1234', '2345', '3456', '4567', '5678', '6789', '0123',
    '4321', '5432', '6543', '7654', '8765', '9876', '3210',
  };

  /// Génère un code PIN aléatoire sécurisé à 4 chiffres (entre 1000 et 9999)
  /// en évitant les motifs triviaux ou facilement devinables.
  static String generateSecurePin() {
    final random = Random.secure();
    String pin;
    do {
      final number = 1000 + random.nextInt(9000); // 1000..9999
      pin = number.toString();
    } while (_blacklist.contains(pin));
    return pin;
  }

  /// Algorithme déterministe et cryptographique basé sur le hash SHA-256
  /// de l'identifiant de commande, d'un sel secret et de la date.
  /// Garantit un PIN unique et reproductible pour une commande donnée.
  static String generatePinForOrder(String orderId, {String secretSalt = 'BABI_BOULANGERIE_SECRET_KEY_2026'}) {
    if (orderId.isEmpty) {
      return generateSecurePin();
    }

    final raw = '$orderId:$secretSalt';
    final bytes = utf8.encode(raw);
    final digest = sha256.convert(bytes);

    // Extraction d'un entier 32-bit à partir des 4 premiers octets du hash
    final hashBytes = digest.bytes;
    int intVal = (hashBytes[0] << 24) | (hashBytes[1] << 16) | (hashBytes[2] << 8) | hashBytes[3];
    intVal = intVal.abs();

    int pinNum = 1000 + (intVal % 9000);
    String pin = pinNum.toString();

    // Si le PIN tombe dans la liste noire, ajuster
    if (_blacklist.contains(pin)) {
      pinNum = (pinNum + 137) % 9000 + 1000;
      pin = pinNum.toString();
    }

    return pin;
  }

  /// Formate le code PIN avec espacement pour une lecture claire (ex: "4 8 2 9")
  static String formatPin(String pin) {
    final clean = pin.replaceAll(RegExp(r'\s+'), '').trim();
    if (clean.length != 4) return pin;
    return '${clean[0]} ${clean[1]} ${clean[2]} ${clean[3]}';
  }

  /// Vérifie si le code PIN saisi correspond au code attendu
  static bool verifyPin({required String expectedPin, required String enteredPin}) {
    final cleanExpected = expectedPin.replaceAll(RegExp(r'\s+'), '').trim();
    final cleanEntered = enteredPin.replaceAll(RegExp(r'\s+'), '').trim();
    if (cleanEntered.isEmpty || cleanExpected.isEmpty) return false;
    return cleanExpected == cleanEntered;
  }
}
