import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/account.dart';
import '../models/monthly_balance.dart';
import '../database/database_helper.dart';

class MonthlyBalanceEditScreen extends StatefulWidget {
  final MonthlyBalance balance;
  final Account account;

  const MonthlyBalanceEditScreen({
    super.key,
    required this.balance,
    required this.account,
  });

  @override
  State<MonthlyBalanceEditScreen> createState() => _MonthlyBalanceEditScreenState();
}

class _MonthlyBalanceEditScreenState extends State<MonthlyBalanceEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _balanceController;
  late final TextEditingController _budgetController;
  late final TextEditingController _descriptionController;
  final dbHelper = DatabaseHelper.instance;
  bool isLoading = true;
  MonthlyBalance? previousMonthBalance;

  @override
  void initState() {
    super.initState();
    _balanceController = TextEditingController(text: widget.balance.balance.toString());
    _budgetController = TextEditingController(text: widget.balance.budget.toString());
    _descriptionController = TextEditingController();
    _loadPreviousMonthBalance();
    setState(() {
      isLoading = false;
    });
  }

  Future<void> _loadPreviousMonthBalance() async {
    // Current month is in format YYYY-MM
    final currentMonthStr = widget.balance.monthKey;
    
    try {
      // Parse the current month
      final currentMonth = DateTime.parse('$currentMonthStr-01');
      
      // Calculate previous month
      final previousMonth = DateTime(
        currentMonth.year,
        currentMonth.month - 1,
        1
      );
      
      // Handle year rollover
      final previousMonthStr = '${previousMonth.year}-${previousMonth.month.toString().padLeft(2, '0')}';
      
      // Load previous month's balance
      previousMonthBalance = await dbHelper.getMonthlyBalanceForAccount(
        widget.balance.accountId,
        previousMonthStr
      );
      
      if (previousMonthBalance != null) {
        print('Previous month balance loaded: ${previousMonthBalance!.balance}');
      } else {
        print('No previous month balance found');
      }
    } catch (e) {
      print('Error loading previous month balance: $e');
    }
  }

  Future<void> _saveBalance() async {
    if (_formKey.currentState!.validate()) {
      final newBalance = widget.balance.copyWith(
        balance: double.parse(_balanceController.text),
        budget: double.parse(_budgetController.text),
      );
      
      await dbHelper.createOrUpdateMonthlyBalance(newBalance);
      Navigator.pop(context, newBalance);
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
        title: Text('Kontostand bearbeiten'),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Kontoinformationen
                    Card(
                      margin: const EdgeInsets.only(bottom: 16.0),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Konto: ${widget.account.accountName}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text('Beschreibung: ${widget.account.description}'),
                            Text('Gruppe: ${widget.account.accountGroup}'),
                            Text('Typ: ${_getAccountTypeName(widget.account.accountType)}'),
                            Text('Monat: ${widget.balance.monthKey}'),
                          ],
                        ),
                      ),
                    ),
                    
                    // Vormonatssaldo anzeigen, falls vorhanden
                    if (previousMonthBalance != null)
                      Card(
                        margin: const EdgeInsets.only(bottom: 16.0),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Vormonat:',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text('Kontostand: ${previousMonthBalance!.balance.toStringAsFixed(2)} €'),
                              Text('Budget: ${previousMonthBalance!.budget.toStringAsFixed(2)} €'),
                            ],
                          ),
                        ),
                      ),
                    
                    // Kontostand
                    TextFormField(
                      controller: _balanceController,
                      decoration: const InputDecoration(
                        labelText: 'Kontostand (€)',
                        hintText: 'Aktueller Kontostand',
                        prefixIcon: Icon(Icons.account_balance_wallet),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'^\-?\d*\.?\d*')),
                      ],
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Bitte geben Sie einen Kontostand ein';
                        }
                        if (double.tryParse(value) == null) {
                          return 'Bitte geben Sie eine gültige Zahl ein';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    // Budget
                    TextFormField(
                      controller: _budgetController,
                      decoration: const InputDecoration(
                        labelText: 'Budget (€)',
                        hintText: 'Verfügbares Budget',
                        prefixIcon: Icon(Icons.euro),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'^\-?\d*\.?\d*')),
                      ],
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Bitte geben Sie ein Budget ein';
                        }
                        if (double.tryParse(value) == null) {
                          return 'Bitte geben Sie eine gültige Zahl ein';
                        }
                        return null;
                      },
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Speichern-Button
                    Center(
                      child: ElevatedButton.icon(
                        onPressed: _saveBalance,
                        icon: const Icon(Icons.save),
                        label: const Text('Speichern'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(200, 50),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
