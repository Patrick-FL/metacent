import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io' show Platform;
import '../models/account.dart';
import '../models/monthly_balance.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('metacent.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, filePath);
    
    // Use platform-specific database factory
    if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
      // Windows/Linux/macOS-specific initialization
      sqfliteFfiInit();
      final databaseFactory = databaseFactoryFfi;
      
      return await databaseFactory.openDatabase(
        path,
        options: OpenDatabaseOptions(
          version: 4,
          onCreate: _createDB,
          onUpgrade: _upgradeDB,
        ),
      );
    } else {
      // For Android and iOS, use the standard implementation
      return await openDatabase(
        path,
        version: 4,
        onCreate: _createDB,
        onUpgrade: _upgradeDB,
      );
    }
  }

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      // Erstelle die neuen Tabellen, wenn wir von Version 1 auf 2 upgraden
      await db.execute('''
        CREATE TABLE monthly_balances (
          accountNumber TEXT,
          month TEXT,
          balance REAL NOT NULL,
          budget REAL NOT NULL,
          PRIMARY KEY (accountNumber, month),
          FOREIGN KEY (accountNumber) REFERENCES accounts (accountNumber) ON DELETE CASCADE
        )
      ''');
    }
    
    if (oldVersion < 3) {
      // Upgrade von Version 2 auf 3 - Änderung der Kontostruktur
      
      // 1. Erstelle eine temporäre Tabelle mit der neuen Struktur
      await db.execute('''
        CREATE TABLE accounts_temp (
          id TEXT PRIMARY KEY,
          accountName TEXT NOT NULL,
          accountGroup TEXT NOT NULL,
          accountType TEXT NOT NULL,
          budgetGoal REAL NOT NULL,
          description TEXT NOT NULL,
          monthlyNormalizedBudget REAL NOT NULL
        )
      ''');
      
      // 2. Kopiere Daten von der alten zur neuen Tabelle
      final accounts = await db.query('accounts');
      for (var account in accounts) {
        final id = DateTime.now().millisecondsSinceEpoch.toString() + '_' + (account['accountNumber'] as String);
        await db.insert('accounts_temp', {
          'id': id,
          'accountName': account['accountNumber'],
          'accountGroup': account['accountGroup'],
          'accountType': account['accountType'],
          'budgetGoal': account['budgetGoal'],
          'description': account['description'],
          'monthlyNormalizedBudget': account['monthlyNormalizedBudget'],
        });
      }
      
      // 3. Aktualisiere die Foreign Keys in den abhängigen Tabellen
      // (Wir müssen eine Mapping-Tabelle erstellen, um die alten Kontonummern mit den neuen IDs zu verknüpfen)
      final mapping = <String, String>{};
      final tempAccounts = await db.query('accounts_temp');
      for (var account in tempAccounts) {
        mapping[account['accountName'] as String] = account['id'] as String;
      }
      
      // 4. Erstelle neue Versionen der abhängigen Tabellen
      await db.execute('''
        CREATE TABLE monthly_balances_temp (
          account_id TEXT,
          month TEXT,
          balance REAL NOT NULL,
          budget REAL NOT NULL,
          PRIMARY KEY (account_id, month),
          FOREIGN KEY (account_id) REFERENCES accounts_temp (id) ON DELETE CASCADE
        )
      ''');
      
      // 5. Kopiere Daten in die neuen Tabellen mit aktualisierten Referenzen
      final balances = await db.query('monthly_balances');
      for (var balance in balances) {
        final accountNumber = balance['accountNumber'] as String;
        if (mapping.containsKey(accountNumber)) {
          await db.insert('monthly_balances_temp', {
            'account_id': mapping[accountNumber],
            'month': balance['month'],
            'balance': balance['balance'],
            'budget': balance['budget'],
          });
        }
      }
      
      // 6. Lösche die alten Tabellen
      await db.execute('DROP TABLE IF EXISTS monthly_balances');
      await db.execute('DROP TABLE IF EXISTS accounts');
      
      // 7. Benenne die temporären Tabellen um
      await db.execute('ALTER TABLE accounts_temp RENAME TO accounts');
      await db.execute('ALTER TABLE monthly_balances_temp RENAME TO monthly_balances');
    }
    
    if (oldVersion < 4) {
      // Upgrade von Version 3 auf 4 - Entfernen der Transaktionen-Tabelle
      
      // Wir löschen die Transaktionen-Tabelle, da wir nur noch mit monatlichen Salden arbeiten
      await db.execute('DROP TABLE IF EXISTS transactions');
    }
  }

  Future<void> _createDB(Database db, int version) async {
    if (version < 3) {
      // Alte Tabellenstruktur für Versionen < 3
      await db.execute('''
        CREATE TABLE accounts (
          accountNumber TEXT PRIMARY KEY,
          accountGroup TEXT NOT NULL,
          accountType TEXT NOT NULL,
          budgetGoal REAL NOT NULL,
          description TEXT NOT NULL,
          monthlyNormalizedBudget REAL NOT NULL
        )
      ''');
      
      if (version >= 2) {
        await db.execute('''
          CREATE TABLE monthly_balances (
            accountNumber TEXT,
            month TEXT,
            balance REAL NOT NULL,
            budget REAL NOT NULL,
            PRIMARY KEY (accountNumber, month),
            FOREIGN KEY (accountNumber) REFERENCES accounts (accountNumber) ON DELETE CASCADE
          )
        ''');
      }
    } else {
      // Neue Tabellenstruktur für Version 3+
      await db.execute('''
        CREATE TABLE accounts (
          id TEXT PRIMARY KEY,
          accountName TEXT NOT NULL,
          accountGroup TEXT NOT NULL,
          accountType TEXT NOT NULL,
          budgetGoal REAL NOT NULL,
          description TEXT NOT NULL,
          monthlyNormalizedBudget REAL NOT NULL
        )
      ''');
      
      await db.execute('''
        CREATE TABLE monthly_balances (
          account_id TEXT,
          month TEXT,
          balance REAL NOT NULL,
          budget REAL NOT NULL,
          PRIMARY KEY (account_id, month),
          FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
        )
      ''');
    }
  }

  // Account CRUD Operationen
  Future<int> createAccount(Account account) async {
    final db = await instance.database;
    
    // Verwende die ID des Account-Objekts, wenn vorhanden, sonst generiere eine neue
    final accountId = account.id ?? DateTime.now().millisecondsSinceEpoch.toString() + '_' + account.accountName;
    
    return await db.insert('accounts', {
      'id': accountId,
      'accountName': account.accountName,
      'accountGroup': account.accountGroup,
      'accountType': account.accountType.toString(),
      'budgetGoal': account.budgetGoal,
      'description': account.description,
      'monthlyNormalizedBudget': account.monthlyNormalizedBudget,
    });
  }

  Future<List<Account>> getAllAccounts() async {
    final db = await instance.database;
    
    try {
      final result = await db.query('accounts');
      
      // Add debug print to verify the database query result
      print('Database query result: ${result.length} accounts found');
      
      if (result.isEmpty) {
        print('No accounts found in database');
        return [];
      }
      
      // Debug: Print raw data from database
      for (var row in result) {
        print('Raw account data: $row');
      }
      
      return result.map((json) {
        try {
          return Account.fromJson({
            ...json,
            'accountType': json['accountType'].toString(),
          });
        } catch (e) {
          print('Error parsing account: $e');
          print('Problematic JSON: $json');
          return null;
        }
      }).whereType<Account>().toList();
    } catch (e) {
      print('Error querying accounts: $e');
      return [];
    }
  }

  Future<int> updateAccount(Account account) async {
    final db = await instance.database;
    
    // Add debug print to verify the account data being updated
    print('Updating account in DB: ${account.accountName}, ${account.description}');
    print('Account data: ${account.toJson()}');
    
    try {
      if (account.id == null) {
        print('Account ID is null, cannot update');
        return 0;
      }

      // Überprüfen, ob das Konto existiert
      final existingAccount = await db.query(
        'accounts',
        where: 'id = ?',
        whereArgs: [account.id],
      );
      
      print('Existing account check result: ${existingAccount.length} rows found');
      if (existingAccount.isEmpty) {
        print('Account with ID ${account.id} not found in database');
        return 0;
      }
      
      print('Existing account data: $existingAccount');
      
      final result = await db.update(
        'accounts',
        {
          'accountName': account.accountName,
          'accountGroup': account.accountGroup,
          'accountType': account.accountType.toString(),
          'budgetGoal': account.budgetGoal,
          'description': account.description,
          'monthlyNormalizedBudget': account.monthlyNormalizedBudget,
        },
        where: 'id = ?',
        whereArgs: [account.id],
      );
      
      print('Update result from database: $result');
      return result;
    } catch (e) {
      print('Error updating account: $e');
      return 0;
    }
  }

  // Löscht ein Konto anhand seiner ID
  Future<int> deleteAccount(String? id) async {
    if (id == null) return 0;
    
    final db = await instance.database;
    
    try {
      // Überprüfen, ob das Konto existiert
      final exists = await accountExists(id);
      if (!exists) {
        print('Account with ID $id not found, cannot delete');
        return 0;
      }
      
      // Konto löschen
      // Dank der ON DELETE CASCADE Constraints werden auch alle zugehörigen
      // Kontostände und Transaktionen automatisch gelöscht
      final result = await db.delete(
        'accounts',
        where: 'id = ?',
        whereArgs: [id],
      );
      
      print('Delete account result: $result');
      return result;
    } catch (e) {
      print('Error deleting account: $e');
      return 0;
    }
  }

  Future<List<String>> getAllAccountGroups() async {
    final db = await instance.database;
    final result = await db.query(
      'accounts',
      columns: ['accountGroup'],
      distinct: true,
    );
    return result.map((row) => row['accountGroup'] as String).toList();
  }

  Future<bool> accountExists(String? id) async {
    if (id == null) return false;
    
    final db = await database;
    final result = await db.query(
      'accounts',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return result.isNotEmpty;
  }

  Future<bool> accountNameExists(String accountName) async {
    final db = await database;
    final result = await db.query(
      'accounts',
      where: 'accountName = ?',
      whereArgs: [accountName],
      limit: 1,
    );
    return result.isNotEmpty;
  }

  Future<bool> accountNameExistsExcept(String accountName, String id) async {
    final db = await database;
    final result = await db.query(
      'accounts',
      where: 'accountName = ? AND id != ?',
      whereArgs: [accountName, id],
      limit: 1,
    );
    return result.isNotEmpty;
  }

  // MonthlyBalance CRUD Operationen
  Future<void> createOrUpdateMonthlyBalance(MonthlyBalance balance) async {
    final db = await instance.database;
    await db.insert(
      'monthly_balances',
      balance.toJson(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<MonthlyBalance>> getMonthlyBalancesForMonth(String month) async {
    final db = await instance.database;
    
    try {
      final result = await db.query(
        'monthly_balances',
        where: 'month = ?',
        whereArgs: [month],
      );
      
      List<MonthlyBalance> balances = [];
      for (var json in result) {
        try {
          balances.add(MonthlyBalance.fromJson(json));
        } catch (e) {
          print('Error parsing balance: $e');
          print('Problematic JSON: $json');
          // Skip invalid balances
        }
      }
      
      return balances;
    } catch (e) {
      print('Error getting monthly balances: $e');
      return [];
    }
  }

  Future<MonthlyBalance?> getMonthlyBalanceForAccount(String accountId, String month) async {
    final db = await instance.database;
    final result = await db.query(
      'monthly_balances',
      where: 'account_id = ? AND month = ?',
      whereArgs: [accountId, month],
    );
    
    if (result.isEmpty) {
      return null;
    }
    
    return MonthlyBalance.fromJson(result.first);
  }

  Future<List<String>> getAvailableMonths() async {
    final db = await instance.database;
    final result = await db.query(
      'monthly_balances',
      columns: ['month'],
      distinct: true,
      orderBy: 'month DESC',
    );
    
    return result.map((row) => row['month'] as String).toList();
  }

  // Hilfsmethoden für die Monatsverwaltung
  Future<void> carryOverBudgets(String fromMonth, String toMonth) async {
    final db = await instance.database;
    
    try {
      // Prüfe, ob der Zielmonat bereits existiert
      final existingBalances = await getMonthlyBalancesForMonth(toMonth);
      if (existingBalances.isNotEmpty) {
        print('Month $toMonth already exists, skipping budget carryover');
        return;
      }
      
      // Hole alle Konten
      final accounts = await getAllAccounts();
      
      // Hole alle Salden für den Quellmonat
      final sourceBalances = await getMonthlyBalancesForMonth(fromMonth);
      
      // Erstelle neue Salden für den Zielmonat
      for (var account in accounts) {
        // Finde den Saldo für dieses Konto im Quellmonat
        final sourceBalance = sourceBalances.firstWhere(
          (b) => b.accountId == account.id,
          orElse: () => MonthlyBalance(
            accountId: account.id!,
            month: DateTime.parse('$fromMonth-01'),
            balance: 0.0,
            budget: account.monthlyNormalizedBudget,
          ),
        );
        
        // Erstelle einen neuen Saldo für den Zielmonat
        final newBalance = MonthlyBalance(
          accountId: account.id!,
          month: DateTime.parse('$toMonth-01'),
          balance: sourceBalance.balance, // Übernehme den Kontostand
          budget: account.monthlyNormalizedBudget, // Setze das Budget auf den Normalwert
        );
        
        // Speichere den neuen Saldo
        await createOrUpdateMonthlyBalance(newBalance);
      }
    } catch (e) {
      print('Error carrying over budgets: $e');
      rethrow;
    }
  }

  Future<void> initializeMonthIfNeeded(String month) async {
    if (!_isValidMonthFormat(month)) {
      throw Exception('Ungültiges Monatsformat: $month');
    }
    
    final db = await instance.database;
    
    try {
      // Prüfe, ob der Monat bereits existiert
      final existingBalances = await getMonthlyBalancesForMonth(month);
      if (existingBalances.isNotEmpty) {
        print('Month $month already exists, skipping initialization');
        return;
      }
      
      // Hole alle Konten
      final accounts = await getAllAccounts();
      
      // Hole verfügbare Monate
      final months = await getAvailableMonths();
      
      if (months.isEmpty) {
        // Wenn keine Monate existieren, initialisiere mit Standardwerten
        for (var account in accounts) {
          final newBalance = MonthlyBalance(
            accountId: account.id!,
            month: DateTime.parse('$month-01'),
            balance: 0.0,
            budget: account.monthlyNormalizedBudget,
          );
          
          await createOrUpdateMonthlyBalance(newBalance);
        }
      } else {
        // Sortiere Monate absteigend
        months.sort((a, b) => b.compareTo(a));
        
        // Finde den letzten Monat
        final lastMonth = months.first;
        
        // Übertrage Budgets vom letzten Monat
        await carryOverBudgets(lastMonth, month);
      }
    } catch (e) {
      print('Error initializing month: $e');
      rethrow;
    }
  }

  Future<int> cleanupInvalidBalances() async {
    final db = await instance.database;
    
    try {
      // Hole alle Konten
      final accounts = await getAllAccounts();
      final accountIds = accounts.map((a) => a.id).whereType<String>().toList();
      
      // Hole alle Salden
      final balances = await db.query('monthly_balances');
      
      // Zähle, wie viele Salden gelöscht werden
      int deletedCount = 0;
      
      // Prüfe jeden Saldo
      for (var balance in balances) {
        final accountId = balance['account_id'] as String?;
        
        // Wenn das Konto nicht existiert, lösche den Saldo
        if (accountId == null || !accountIds.contains(accountId)) {
          await db.delete(
            'monthly_balances',
            where: 'account_id = ?',
            whereArgs: [accountId],
          );
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (e) {
      print('Error cleaning up invalid balances: $e');
      return 0;
    }
  }

  Future<List<MonthlyBalance>> getAccountBalanceHistory(String accountId, {int monthsLimit = 12}) async {
    final db = await instance.database;
    
    try {
      // Get all available monthly balances for this account
      final List<Map<String, dynamic>> maps = await db.query(
        'monthly_balances',
        where: 'account_id = ?',
        whereArgs: [accountId],
      );
      
      // Convert to MonthlyBalance objects
      List<MonthlyBalance> balances = List.generate(maps.length, (i) {
        return MonthlyBalance.fromJson(maps[i]);
      });
      
      // Sort by month (descending)
      balances.sort((a, b) => b.month.compareTo(a.month));
      
      // Limit to the requested number of months
      if (balances.length > monthsLimit) {
        balances = balances.sublist(0, monthsLimit);
      }
      
      // Return in chronological order for charting
      return balances.reversed.toList();
    } catch (e) {
      print('Error fetching account balance history: $e');
      return [];
    }
  }

  bool _isValidMonthFormat(String month) {
    final RegExp regex = RegExp(r'^\d{4}-\d{2}$');
    return regex.hasMatch(month);
  }
}
