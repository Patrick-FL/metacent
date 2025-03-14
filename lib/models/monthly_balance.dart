import 'package:flutter/material.dart';

class MonthlyBalance {
  final String accountId;
  final DateTime month;
  final double balance;
  final double budget;

  MonthlyBalance({
    required this.accountId,
    required this.month,
    required this.balance,
    required this.budget,
  });

  // Erstellt einen Schlüssel für den Monat im Format 'YYYY-MM'
  String get monthKey => '${month.year}-${month.month.toString().padLeft(2, '0')}';

  // Factory-Konstruktor zum Erstellen aus JSON (für Datenbank)
  factory MonthlyBalance.fromJson(Map<String, dynamic> json) {
    DateTime monthDate;
    try {
      // Try to parse the month string
      final monthStr = json['month'] as String? ?? '';
      
      // Check if the format is YYYY-MM
      final RegExp regex = RegExp(r'^\d{4}-\d{2}$');
      if (regex.hasMatch(monthStr)) {
        monthDate = DateTime.parse('$monthStr-01');
      } else {
        print('Invalid month format in MonthlyBalance.fromJson: $monthStr');
        // Fallback to current month if invalid
        final now = DateTime.now();
        monthDate = DateTime(now.year, now.month, 1);
      }
    } catch (e) {
      print('Error parsing month in MonthlyBalance.fromJson: $e');
      print('Problematic JSON: $json');
      // Fallback to current month
      final now = DateTime.now();
      monthDate = DateTime(now.year, now.month, 1);
    }
    
    return MonthlyBalance(
      accountId: json['account_id'] ?? json['accountNumber'] ?? '',
      month: monthDate,
      balance: json['balance'] is String 
          ? double.tryParse(json['balance']) ?? 0.0 
          : (json['balance'] as num?)?.toDouble() ?? 0.0,
      budget: json['budget'] is String 
          ? double.tryParse(json['budget']) ?? 0.0 
          : (json['budget'] as num?)?.toDouble() ?? 0.0,
    );
  }

  // Konvertiert Objekt zu JSON (für Datenbank)
  Map<String, dynamic> toJson() {
    return {
      'account_id': accountId,
      'month': month.toIso8601String().substring(0, 7), // Format 'YYYY-MM'
      'balance': balance,
      'budget': budget,
    };
  }

  // Erstellt eine Kopie mit aktualisierten Werten
  MonthlyBalance copyWith({
    String? accountId,
    DateTime? month,
    double? balance,
    double? budget,
  }) {
    return MonthlyBalance(
      accountId: accountId ?? this.accountId,
      month: month ?? this.month,
      balance: balance ?? this.balance,
      budget: budget ?? this.budget,
    );
  }
}
