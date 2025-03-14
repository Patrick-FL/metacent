import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../database/database_helper.dart';
import '../models/account.dart';
import '../models/transaction.dart';
import 'transaction_edit.dart';

class TransactionListScreen extends StatefulWidget {
  const TransactionListScreen({super.key});

  @override
  State<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends State<TransactionListScreen> {
  final dbHelper = DatabaseHelper.instance;
  List<Transaction> transactions = [];
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
    final currentMonth = months.first;
    
    // Lade Transaktionen für den ausgewählten Monat
    final loadedTransactions = await dbHelper.getTransactionsForMonth(currentMonth);
    
    setState(() {
      accounts = loadedAccounts;
      availableMonths = months;
      selectedMonth = currentMonth;
      transactions = loadedTransactions;
      isLoading = false;
    });
  }

  Future<void> _loadTransactionsForMonth(String month) async {
    setState(() {
      isLoading = true;
    });
    
    // Lade Transaktionen für den ausgewählten Monat
    final loadedTransactions = await dbHelper.getTransactionsForMonth(month);
    
    setState(() {
      selectedMonth = month;
      transactions = loadedTransactions;
      isLoading = false;
    });
  }

  Future<void> _createNewTransaction() async {
    final result = await Navigator.push<Transaction>(
      context,
      MaterialPageRoute(
        builder: (context) => TransactionEditScreen(
          accounts: accounts,
          month: selectedMonth,
        ),
      ),
    );
    
    if (result != null) {
      await dbHelper.createTransaction(result);
      await _loadTransactionsForMonth(selectedMonth);
    }
  }

  String _formatCurrency(double amount) {
    final formatter = NumberFormat.currency(locale: 'de_DE', symbol: '€');
    return formatter.format(amount);
  }

  String _formatMonth(String month) {
    final date = DateTime.parse('$month-01');
    return DateFormat('MMMM yyyy', 'de_DE').format(date);
  }

  String _formatDate(DateTime date) {
    return DateFormat('dd.MM.yyyy HH:mm', 'de_DE').format(date);
  }

  String _getTransactionTypeName(TransactionType type) {
    return switch (type) {
      TransactionType.initialBalance => 'Anfangsbestand',
      TransactionType.budgetAssignment => 'Budgetzuweisung',
      TransactionType.budgetCarryover => 'Budgetübertrag',
      TransactionType.balanceUpdate => 'Kontostandaktualisierung',
      TransactionType.transfer => 'Überweisung',
      TransactionType.expense => 'Ausgabe',
      TransactionType.income => 'Einnahme',
    };
  }

  String _getAccountName(String accountId) {
    final account = accounts.firstWhere(
      (a) => a.id == accountId,
      orElse: () => Account(
        id: accountId,
        accountName: 'Unbekannt',
        accountGroup: '',
        accountType: AccountType.moneyBusy,
        budgetGoal: 0,
        description: 'Unbekanntes Konto',
        monthlyNormalizedBudget: 0,
      ),
    );
    
    return '${account.accountName} - ${account.description}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Transaktionen: ${_formatMonth(selectedMonth)}'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (month) => _loadTransactionsForMonth(month),
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
          : transactions.isEmpty
              ? const Center(
                  child: Text(
                    'Keine Transaktionen für diesen Monat vorhanden',
                    style: TextStyle(fontSize: 16),
                  ),
                )
              : ListView.builder(
                  itemCount: transactions.length,
                  itemBuilder: (context, index) {
                    final transaction = transactions[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: ListTile(
                        title: Text(transaction.description),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_getTransactionTypeName(transaction.type)),
                            Text('Von: ${_getAccountName(transaction.accountId)}'),
                            if (transaction.targetAccountId != null)
                              Text('An: ${_getAccountName(transaction.targetAccountId!)}'),
                            Text('Datum: ${_formatDate(transaction.date)}'),
                          ],
                        ),
                        trailing: Text(
                          _formatCurrency(transaction.amount),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: transaction.amount >= 0 ? Colors.green : Colors.red,
                          ),
                        ),
                        isThreeLine: true,
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createNewTransaction,
        tooltip: 'Neue Transaktion',
        child: const Icon(Icons.add),
      ),
    );
  }
}
