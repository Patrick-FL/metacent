import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../database/database_helper.dart';
import '../models/account.dart';
import '../models/monthly_balance.dart';
import 'monthly_balance_edit.dart';

class MonthlyOverviewScreen extends StatefulWidget {
  const MonthlyOverviewScreen({super.key});

  @override
  State<MonthlyOverviewScreen> createState() => _MonthlyOverviewScreenState();
}

class _MonthlyOverviewScreenState extends State<MonthlyOverviewScreen> {
  final dbHelper = DatabaseHelper.instance;
  List<MonthlyBalance> balances = [];
  List<Account> accounts = [];
  String selectedMonth = '';
  List<String> availableMonths = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    setState(() {
      isLoading = true;
    });

    try {
      // Clean up invalid balances first
      final cleanedCount = await dbHelper.cleanupInvalidBalances();
      if (cleanedCount > 0) {
        print('Cleaned up $cleanedCount invalid balances');
      }
      
      // Lade alle Konten
      final loadedAccounts = await dbHelper.getAllAccounts();
      
      // Lade verfügbare Monate
      List<String> months = await dbHelper.getAvailableMonths();
      
      // Wenn keine Monate vorhanden sind, initialisiere den aktuellen Monat
      if (months.isEmpty) {
        final now = DateTime.now();
        final currentMonth = '${now.year}-${now.month.toString().padLeft(2, '0')}';
        await dbHelper.initializeMonthIfNeeded(currentMonth);
        months = [currentMonth];
      }
      
      // Sortiere Monate absteigend
      months.sort((a, b) => b.compareTo(a));
      
      // Wähle den neuesten Monat aus
      final currentMonth = months.isNotEmpty ? months.first : '';
      
      // Lade Balances für den ausgewählten Monat
      List<MonthlyBalance> loadedBalances = [];
      if (currentMonth.isNotEmpty) {
        loadedBalances = await dbHelper.getMonthlyBalancesForMonth(currentMonth);
      }
      
      setState(() {
        accounts = loadedAccounts;
        availableMonths = months;
        selectedMonth = currentMonth;
        balances = loadedBalances;
        isLoading = false;
      });
    } catch (e) {
      print('Error initializing data: $e');
      setState(() {
        isLoading = false;
        accounts = [];
        availableMonths = [];
        selectedMonth = '';
        balances = [];
      });
      
      // Show error message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler beim Laden der Daten: $e')),
        );
      }
    }
  }

  Future<void> _loadBalancesForMonth(String month) async {
    setState(() {
      isLoading = true;
    });
    
    try {
      // Validate month format
      if (month.isEmpty || !RegExp(r'^\d{4}-\d{2}$').hasMatch(month)) {
        throw Exception('Ungültiges Monatsformat: $month');
      }
      
      // Stelle sicher, dass der Monat initialisiert ist
      await dbHelper.initializeMonthIfNeeded(month);
      
      // Lade Balances für den ausgewählten Monat
      final loadedBalances = await dbHelper.getMonthlyBalancesForMonth(month);
      
      setState(() {
        selectedMonth = month;
        balances = loadedBalances;
        isLoading = false;
      });
    } catch (e) {
      print('Error loading balances for month: $e');
      setState(() {
        isLoading = false;
        // Keep the previous balances if there's an error
      });
      
      // Show error message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler beim Laden der Daten für $month: $e')),
        );
      }
    }
  }

  Future<void> _createNewMonth() async {
    try {
      // Validate current month
      if (selectedMonth.isEmpty || !RegExp(r'^\d{4}-\d{2}$').hasMatch(selectedMonth)) {
        throw Exception('Ungültiges aktuelles Monatsformat: $selectedMonth');
      }
      
      // Hole den letzten Monat
      final lastMonth = selectedMonth;
      
      // Berechne den nächsten Monat
      final lastDate = DateTime.parse('$lastMonth-01');
      final nextDate = DateTime(lastDate.year, lastDate.month + 1, 1);
      final nextMonth = '${nextDate.year}-${nextDate.month.toString().padLeft(2, '0')}';
      
      // Prüfe, ob der nächste Monat bereits existiert
      if (availableMonths.contains(nextMonth)) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Der Monat $nextMonth existiert bereits')),
        );
        return;
      }
      
      // Übertrage Budgets vom letzten Monat
      await dbHelper.carryOverBudgets(lastMonth, nextMonth);
      
      // Aktualisiere die UI
      await _initializeData();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Neuer Monat $nextMonth erstellt')),
      );
    } catch (e) {
      print('Error creating new month: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fehler beim Erstellen des neuen Monats: $e')),
      );
    }
  }

  Future<void> _editBalance(MonthlyBalance balance) async {
    try {
      // Find the account or show error if not found
      final accountOpt = accounts.where((a) => a.id == balance.accountId).toList();
      if (accountOpt.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler: Konto mit ID ${balance.accountId} nicht gefunden')),
        );
        return;
      }
      
      final account = accountOpt.first;
      
      final result = await Navigator.push<MonthlyBalance>(
        context,
        MaterialPageRoute(
          builder: (context) => MonthlyBalanceEditScreen(
            balance: balance,
            account: account,
          ),
        ),
      );
      
      if (result != null) {
        await dbHelper.createOrUpdateMonthlyBalance(result);
        await _loadBalancesForMonth(selectedMonth);
      }
    } catch (e) {
      print('Error editing balance: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fehler beim Bearbeiten des Kontostands: $e')),
      );
    }
  }

  String _formatCurrency(double amount) {
    final formatter = NumberFormat.currency(locale: 'de_DE', symbol: '€');
    return formatter.format(amount);
  }

  String _formatMonth(String month) {
    try {
      // Validate month format before parsing
      if (month == null || month.isEmpty) {
        return 'Ungültiges Datum';
      }
      
      // Check if the format is YYYY-MM
      final RegExp regex = RegExp(r'^\d{4}-\d{2}$');
      if (!regex.hasMatch(month)) {
        print('Invalid month format in _formatMonth: $month');
        return 'Ungültiges Datumsformat: $month';
      }
      
      final date = DateTime.parse('$month-01');
      return DateFormat('MMMM yyyy', 'de_DE').format(date);
    } catch (e) {
      print('Error formatting month: $e');
      return 'Fehler: $month';
    }
  }

  String _getAccountTypeName(AccountType type) {
    return switch (type) {
      AccountType.moneyBusy => 'Money Busy',
      AccountType.moneyIdle => 'Money Idle',
      AccountType.physical => 'Physical',
      AccountType.budgetFix => 'Budget Fix',
      AccountType.budgetVariable => 'Budget Variable',
      AccountType.budgetProvisions => 'Budget Provisions',
      AccountType.moneyCredit => 'Money Credit',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Monatsübersicht: ${_formatMonth(selectedMonth)}'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (month) => _loadBalancesForMonth(month),
            itemBuilder: (context) => availableMonths
                .map((month) => PopupMenuItem<String>(
                      value: month,
                      child: Text(_formatMonth(month)),
                    ))
                .toList(),
            icon: const Icon(Icons.calendar_month),
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : balances.isEmpty
              ? const Center(
                  child: Text(
                    'Keine Daten für diesen Monat vorhanden',
                    style: TextStyle(fontSize: 16),
                  ),
                )
              : _buildBalancesList(),
      floatingActionButton: FloatingActionButton(
        onPressed: _createNewMonth,
        tooltip: 'Neuen Monat erstellen',
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildBalancesList() {
    // Gruppiere Balances nach Kontotyp
    final Map<AccountType, List<MonthlyBalance>> groupedBalances = {};
    List<MonthlyBalance> validBalances = [];
    
    // Filter out balances with missing accounts
    for (var balance in balances) {
      try {
        final accountOpt = accounts.where((a) => a.id == balance.accountId).toList();
        if (accountOpt.isEmpty) {
          print('Warning: Account with ID ${balance.accountId} not found for balance. Skipping this balance.');
          continue;
        }
        
        validBalances.add(balance);
      } catch (e) {
        print('Error processing balance: $e');
      }
    }
    
    // Group valid balances by account type
    for (var balance in validBalances) {
      try {
        // Find the account or skip this balance if not found
        final accountOpt = accounts.where((a) => a.id == balance.accountId).toList();
        if (accountOpt.isEmpty) {
          print('Warning: Account with ID ${balance.accountId} not found.');
          continue;
        }
        
        final account = accountOpt.first;
        
        if (!groupedBalances.containsKey(account.accountType)) {
          groupedBalances[account.accountType] = [];
        }
        
        groupedBalances[account.accountType]!.add(balance);
      } catch (e) {
        print('Error grouping balance: $e');
      }
    }
    
    // Berechne Summen
    double totalCashFlow = 0;
    double totalNetWorth = 0;
    
    for (var balance in validBalances) {
      try {
        // Find the account or skip this balance if not found
        final accountOpt = accounts.where((a) => a.id == balance.accountId).toList();
        if (accountOpt.isEmpty) {
          print('Warning: Account with ID ${balance.accountId} not found.');
          continue;
        }
        
        final account = accountOpt.first;
        
        // Cash Flow Berechnung
        if (account.accountType == AccountType.moneyBusy || 
            account.accountType == AccountType.moneyIdle) {
          totalCashFlow += balance.balance;
        } else if (account.accountType == AccountType.physical) {
          totalCashFlow += 0;
        } else {
          totalCashFlow -= balance.balance;
        }
        
        // Net Worth Berechnung
        if (account.accountType == AccountType.moneyBusy || 
            account.accountType == AccountType.moneyIdle) {
          totalNetWorth += balance.balance;
        } else if (account.accountType == AccountType.moneyCredit) {
          totalNetWorth -= balance.balance;
        }
      } catch (e) {
        print('Error calculating totals: $e');
      }
    }
    
    return Column(
      children: [
        // Zusammenfassung
        Card(
          margin: const EdgeInsets.all(8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Zusammenfassung',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Cash Flow Balance:'),
                    Text(
                      _formatCurrency(totalCashFlow),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: totalCashFlow >= 0 ? Colors.green : Colors.red,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Net Worth Cash:'),
                    Text(
                      _formatCurrency(totalNetWorth),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: totalNetWorth >= 0 ? Colors.green : Colors.red,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        
        // Liste der Konten nach Typ
        Expanded(
          child: ListView(
            children: AccountType.values.map((type) {
              final typeBalances = groupedBalances[type] ?? [];
              
              if (typeBalances.isEmpty) {
                return const SizedBox.shrink();
              }
              
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      _getAccountTypeName(type),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  ...typeBalances.map((balance) {
                    // Find the account or return an empty widget if not found
                    final accountOpt = accounts.where((a) => a.id == balance.accountId).toList();
                    if (accountOpt.isEmpty) {
                      print('Warning: Account with ID ${balance.accountId} not found for list item.');
                      return const SizedBox.shrink();
                    }
                    
                    final account = accountOpt.first;
                    
                    return ListTile(
                      title: Text(account.accountName),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(account.description),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Kontostand: ${_formatCurrency(balance.balance)}',
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  'Budget: ${_formatCurrency(balance.budget)}',
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      isThreeLine: true,
                      onTap: () => _editBalance(balance),
                    );
                  }).toList(),
                  const Divider(),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
