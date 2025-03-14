enum AccountType {
  moneyBusy,
  moneyIdle,
  physical,
  budgetFix,
  budgetVariable,
  budgetProvisions,
  moneyCredit
}

class Account {
  String? id; // Kann null sein, wenn ein neues Konto erstellt wird
  final String accountName; // Geändert von accountNumber zu accountName
  final String accountGroup;
  final AccountType accountType;
  final double budgetGoal;
  final String description;
  final double monthlyNormalizedBudget;

  Account({
    this.id,
    required this.accountName,
    required this.accountGroup,
    required this.accountType,
    required this.budgetGoal,
    required this.description,
    required this.monthlyNormalizedBudget,
  }) {
    // Wenn keine ID vorhanden ist, generiere eine neue basierend auf dem Zeitstempel
    if (id == null) {
      this.id = DateTime.now().millisecondsSinceEpoch.toString();
    }
  }

  // Konvertiert Objekt zu JSON (für Datenbank)
  Map<String, dynamic> toJson() {
    try {
      final json = {
        if (id != null) 'id': id,
        'accountName': accountName,
        'accountGroup': accountGroup,
        'accountType': accountType.toString().split('.').last,
        'budgetGoal': budgetGoal,
        'description': description,
        'monthlyNormalizedBudget': monthlyNormalizedBudget,
      };
      return json;
    } catch (e) {
      print('Error converting Account to JSON: $e');
      // Return a minimal valid JSON to prevent crashes
      return {
        if (id != null) 'id': id,
        'accountName': '',
        'accountGroup': '',
        'accountType': AccountType.moneyBusy.toString().split('.').last,
        'budgetGoal': 0.0,
        'description': '',
        'monthlyNormalizedBudget': 0.0,
      };
    }
  }

  factory Account.fromJson(Map<String, dynamic> json) {
    try {
      // Debug: Print raw JSON data
      print('Creating Account from JSON: $json');
      
      // Ensure accountType is properly parsed
      String accountTypeStr = json['accountType'] as String;
      print('Account type string: $accountTypeStr');
      
      // Extract the enum value name from the string (remove 'AccountType.')
      if (accountTypeStr.contains('.')) {
        accountTypeStr = accountTypeStr.split('.').last;
      }
      
      // Find the matching enum value
      final accountType = AccountType.values.firstWhere(
        (e) => e.toString() == 'AccountType.$accountTypeStr' || e.toString().split('.').last == accountTypeStr,
        orElse: () {
          print('Warning: Could not find matching AccountType for "$accountTypeStr", defaulting to moneyBusy');
          return AccountType.moneyBusy;
        },
      );
      
      // Parse numeric values safely
      final budgetGoal = json['budgetGoal'] is String 
          ? double.tryParse(json['budgetGoal']) ?? 0.0 
          : (json['budgetGoal'] as num?)?.toDouble() ?? 0.0;
          
      final monthlyNormalizedBudget = json['monthlyNormalizedBudget'] is String 
          ? double.tryParse(json['monthlyNormalizedBudget']) ?? 0.0 
          : (json['monthlyNormalizedBudget'] as num?)?.toDouble() ?? 0.0;
      
      return Account(
        id: json['id'] as String?,
        accountName: json['accountName'] as String? ?? json['accountNumber'] as String? ?? '', // Unterstützung für alte Daten
        accountGroup: json['accountGroup'] as String? ?? '',
        accountType: accountType,
        budgetGoal: budgetGoal,
        description: json['description'] as String? ?? '',
        monthlyNormalizedBudget: monthlyNormalizedBudget,
      );
    } catch (e) {
      print('Error creating Account from JSON: $e');
      print('Problematic JSON: $json');
      rethrow;
    }
  }
}
