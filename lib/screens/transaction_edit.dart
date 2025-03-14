import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/account.dart';
import '../models/transaction.dart';
import '../models/monthly_balance.dart';
import '../database/database_helper.dart';

class TransactionEditScreen extends StatefulWidget {
  final List<Account> accounts;
  final String month;
  final Transaction? transaction;

  const TransactionEditScreen({
    super.key,
    required this.accounts,
    required this.month,
    this.transaction,
  });

  @override
  State<TransactionEditScreen> createState() => _TransactionEditScreenState();
}

class _TransactionEditScreenState extends State<TransactionEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amountController;
  late final TextEditingController _descriptionController;
  late String _selectedAccountId;
  String? _selectedTargetAccountId;
  late TransactionType _selectedType;
  final dbHelper = DatabaseHelper.instance;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    
    // Initialisiere mit Werten aus der übergebenen Transaktion oder mit Standardwerten
    _amountController = TextEditingController(
      text: widget.transaction?.amount.toString() ?? '',
    );
    _descriptionController = TextEditingController(
      text: widget.transaction?.description ?? '',
    );
    _selectedAccountId = widget.transaction?.accountId ?? widget.accounts.first.id!;
    _selectedTargetAccountId = widget.transaction?.targetAccountId;
    _selectedType = widget.transaction?.type ?? TransactionType.expense;
    _selectedDate = widget.transaction?.date ?? DateTime.now();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = DateTime(
          picked.year,
          picked.month,
          picked.day,
          _selectedDate.hour,
          _selectedDate.minute,
        );
      });
    }
  }

  Future<void> _saveTransaction() async {
    if (_formKey.currentState!.validate()) {
      // Erstelle die Transaktion
      final transaction = Transaction(
        id: widget.transaction?.id,
        accountId: _selectedAccountId,
        targetAccountId: _selectedType == TransactionType.transfer
            ? _selectedTargetAccountId
            : null,
        date: _selectedDate,
        type: _selectedType,
        amount: double.parse(_amountController.text),
        description: _descriptionController.text,
        month: widget.month,
      );
      
      // Aktualisiere die Kontostände basierend auf der Transaktion
      await _updateBalances(transaction);
      
      Navigator.pop(context, transaction);
    }
  }

  Future<void> _updateBalances(Transaction transaction) async {
    // Hole den aktuellen Kontostand des Quellkontos
    final sourceBalance = await dbHelper.getMonthlyBalanceForAccount(
      transaction.accountId,
      transaction.month,
    );
    
    if (sourceBalance == null) {
      // Fehler: Kontostand nicht gefunden
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Fehler: Kontostand nicht gefunden')),
      );
      return;
    }
    
    // Aktualisiere den Kontostand basierend auf dem Transaktionstyp
    double newSourceBalance = sourceBalance.balance;
    double newSourceBudget = sourceBalance.budget;
    
    switch (transaction.type) {
      case TransactionType.expense:
        newSourceBalance -= transaction.amount;
        break;
      case TransactionType.income:
        newSourceBalance += transaction.amount;
        break;
      case TransactionType.transfer:
        if (transaction.targetAccountId != null) {
          // Bei Überweisungen: Quellkonto reduzieren, Zielkonto erhöhen
          newSourceBalance -= transaction.amount;
          
          // Hole den aktuellen Kontostand des Zielkontos
          final targetBalance = await dbHelper.getMonthlyBalanceForAccount(
            transaction.targetAccountId!,
            transaction.month,
          );
          
          if (targetBalance != null) {
            // Aktualisiere den Kontostand des Zielkontos
            final newTargetBalance = targetBalance.copyWith(
              balance: targetBalance.balance + transaction.amount,
            );
            
            await dbHelper.createOrUpdateMonthlyBalance(newTargetBalance);
          }
        }
        break;
      case TransactionType.budgetAssignment:
        // Budgetzuweisung: Budget aktualisieren
        newSourceBudget = transaction.amount;
        break;
      case TransactionType.balanceUpdate:
        // Direkte Aktualisierung des Kontostands
        newSourceBalance = transaction.amount;
        break;
      case TransactionType.initialBalance:
        // Anfangsbestand: Kontostand und Budget setzen
        newSourceBalance = transaction.amount;
        break;
      case TransactionType.budgetCarryover:
        // Budgetübertrag: Budget erhöhen
        newSourceBudget += transaction.amount;
        break;
    }
    
    // Aktualisiere den Kontostand des Quellkontos
    final updatedSourceBalance = sourceBalance.copyWith(
      balance: newSourceBalance,
      budget: newSourceBudget,
    );
    
    await dbHelper.createOrUpdateMonthlyBalance(updatedSourceBalance);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.transaction == null
            ? 'Neue Transaktion'
            : 'Transaktion bearbeiten'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              // Transaktionstyp
              DropdownButtonFormField<TransactionType>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Transaktionstyp',
                  helperText: ' ',
                ),
                items: [
                  TransactionType.expense,
                  TransactionType.income,
                  TransactionType.transfer,
                  TransactionType.budgetAssignment,
                  TransactionType.balanceUpdate,
                ].map((type) {
                  String displayName = switch (type) {
                    TransactionType.expense => 'Ausgabe',
                    TransactionType.income => 'Einnahme',
                    TransactionType.transfer => 'Überweisung',
                    TransactionType.budgetAssignment => 'Budgetzuweisung',
                    TransactionType.balanceUpdate => 'Kontostandaktualisierung',
                    _ => type.toString(),
                  };
                  return DropdownMenuItem<TransactionType>(
                    value: type,
                    child: Text(displayName),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedType = value;
                    });
                  }
                },
                validator: (value) {
                  if (value == null) {
                    return 'Bitte wählen Sie einen Transaktionstyp';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Quellkonto
              DropdownButtonFormField<String>(
                value: _selectedAccountId,
                decoration: const InputDecoration(
                  labelText: 'Konto',
                  helperText: ' ',
                ),
                items: widget.accounts.map((account) {
                  return DropdownMenuItem<String>(
                    value: account.id!,
                    child: Text('${account.accountName} - ${account.description}'),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedAccountId = value;
                    });
                  }
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Bitte wählen Sie ein Konto';
                  }
                  return null;
                },
              ),
              
              // Zielkonto (nur für Überweisungen)
              if (_selectedType == TransactionType.transfer) ...[
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedTargetAccountId,
                  decoration: const InputDecoration(
                    labelText: 'Zielkonto',
                    helperText: ' ',
                  ),
                  items: widget.accounts
                      .where((account) => account.id != _selectedAccountId)
                      .map((account) {
                    return DropdownMenuItem<String>(
                      value: account.id!,
                      child: Text('${account.accountName} - ${account.description}'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedTargetAccountId = value;
                      });
                    }
                  },
                  validator: (value) {
                    if (_selectedType == TransactionType.transfer &&
                        (value == null || value.isEmpty)) {
                      return 'Bitte wählen Sie ein Zielkonto';
                    }
                    return null;
                  },
                ),
              ],
              
              const SizedBox(height: 16),
              
              // Betrag
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Betrag',
                  helperText: ' ',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9\.,\-]')),
                ],
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Bitte geben Sie einen Betrag ein';
                  }
                  if (double.tryParse(value) == null) {
                    return 'Bitte geben Sie eine gültige Zahl ein';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Beschreibung
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Beschreibung',
                  helperText: ' ',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Bitte geben Sie eine Beschreibung ein';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Datum
              ListTile(
                title: const Text('Datum'),
                subtitle: Text(
                  '${_selectedDate.day}.${_selectedDate.month}.${_selectedDate.year}',
                ),
                trailing: const Icon(Icons.calendar_today),
                onTap: () => _selectDate(context),
              ),
              
              const SizedBox(height: 24),
              
              ElevatedButton(
                onPressed: _saveTransaction,
                child: const Text('Speichern'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
}
