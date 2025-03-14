enum TransactionType {
  initialBalance,    // Anfangsbestand
  budgetAssignment,  // Budgetzuweisung
  budgetCarryover,   // Budgetübertrag vom Vormonat
  balanceUpdate,     // Aktualisierung des Kontostands
  transfer,          // Überweisung zwischen Konten
  expense,           // Ausgabe
  income,            // Einnahme
}

class Transaction {
  final int? id;
  final String accountId; // Geändert von accountNumber zu accountId
  final String? targetAccountId; // Geändert von targetAccountNumber zu targetAccountId
  final DateTime date;
  final TransactionType type;
  final double amount;
  final String description;
  final String month; // Format 'YYYY-MM'

  Transaction({
    this.id,
    required this.accountId, // Geändert von accountNumber zu accountId
    this.targetAccountId, // Geändert von targetAccountNumber zu targetAccountId
    required this.date,
    required this.type,
    required this.amount,
    required this.description,
    required this.month,
  });

  // Factory-Konstruktor zum Erstellen aus JSON (für Datenbank)
  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      accountId: json['account_id'] ?? json['accountNumber'] ?? '', // Unterstützung für alte Daten
      targetAccountId: json['target_account_id'] ?? json['targetAccountNumber'], // Unterstützung für alte Daten
      date: DateTime.parse(json['date']),
      type: TransactionType.values.firstWhere(
        (e) => e.toString() == 'TransactionType.${json['type']}',
        orElse: () => TransactionType.expense, // Standardwert, falls nicht gefunden
      ),
      amount: json['amount'] is String 
          ? double.tryParse(json['amount']) ?? 0.0 
          : (json['amount'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] ?? '',
      month: json['month'] ?? '',
    );
  }

  // Konvertiert Objekt zu JSON (für Datenbank)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'account_id': accountId, // Geändert von accountNumber zu account_id
      'target_account_id': targetAccountId, // Geändert von targetAccountNumber zu target_account_id
      'date': date.toIso8601String(),
      'type': type.toString().split('.').last,
      'amount': amount,
      'description': description,
      'month': month,
    };
  }
}
