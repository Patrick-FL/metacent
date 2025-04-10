import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'dart:math' as math;
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
  List<MonthlyBalance> balanceHistory = [];

  @override
  void initState() {
    super.initState();
    _balanceController = TextEditingController(text: widget.balance.balance.toString());
    _budgetController = TextEditingController(text: widget.balance.budget.toString());
    _descriptionController = TextEditingController();
    _loadPreviousMonthBalance();
    _loadBalanceHistory();
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

  Future<void> _loadBalanceHistory() async {
    try {
      balanceHistory = await dbHelper.getAccountBalanceHistory(widget.balance.accountId);
      setState(() {});
    } catch (e) {
      print('Error loading balance history: $e');
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
                    
                    // Kontostand-Historie
                    Card(
                      margin: const EdgeInsets.only(bottom: 16.0),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Kontostand-Historie:',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            if (balanceHistory.isEmpty)
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 20.0),
                                child: Center(
                                  child: Text('Keine historischen Daten verfügbar'),
                                ),
                              )
                            else
                              SizedBox(
                                height: 220,
                                child: LineChart(
                                  LineChartData(
                                    lineBarsData: [
                                      LineChartBarData(
                                        spots: balanceHistory.asMap().entries.map((entry) {
                                          // Use index as x-coordinate for even spacing
                                          return FlSpot(entry.key.toDouble(), entry.value.balance);
                                        }).toList(),
                                        isCurved: true,
                                        color: Colors.blue,
                                        barWidth: 3,
                                        isStrokeCapRound: true,
                                        dotData: FlDotData(
                                          show: true,
                                          getDotPainter: (spot, percent, barData, index) {
                                            return FlDotCirclePainter(
                                              radius: 4,
                                              color: Colors.white,
                                              strokeWidth: 2,
                                              strokeColor: Colors.blue,
                                            );
                                          },
                                        ),
                                        belowBarData: BarAreaData(
                                          show: true,
                                          color: Colors.blue.withOpacity(0.2),
                                        ),
                                      ),
                                    ],
                                    gridData: FlGridData(
                                      show: true,
                                      drawVerticalLine: true,
                                      horizontalInterval: balanceHistory.isEmpty ? 1 : 
                                        // Ensure interval is never zero by using max(1, calculated value)
                                        math.max(1, 
                                          (balanceHistory.map((b) => b.balance).reduce((a, b) => a > b ? a : b) -
                                           balanceHistory.map((b) => b.balance).reduce((a, b) => a < b ? a : b)) / 5
                                        ),
                                    ),
                                    titlesData: FlTitlesData(
                                      bottomTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          interval: 1,
                                          getTitlesWidget: (value, meta) {
                                            if (value.toInt() >= 0 && value.toInt() < balanceHistory.length) {
                                              // Format month for display, showing every other month
                                              if (value.toInt() % 2 == 0 || balanceHistory.length <= 6) {
                                                return Padding(
                                                  padding: const EdgeInsets.only(top: 8.0),
                                                  child: Text(
                                                    DateFormat('MMM\nyyyy').format(
                                                      DateTime.parse('${balanceHistory[value.toInt()].monthKey}-01')
                                                    ),
                                                    style: const TextStyle(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                );
                                              }
                                            }
                                            return const SizedBox();
                                          },
                                        ),
                                      ),
                                      leftTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          getTitlesWidget: (value, meta) {
                                            return Padding(
                                              padding: const EdgeInsets.only(right: 8.0),
                                              child: Text(
                                                NumberFormat.compact().format(value),
                                                style: const TextStyle(fontSize: 10),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                      rightTitles: AxisTitles(
                                        sideTitles: SideTitles(showTitles: false),
                                      ),
                                      topTitles: AxisTitles(
                                        sideTitles: SideTitles(showTitles: false),
                                      ),
                                    ),
                                    borderData: FlBorderData(
                                      show: true,
                                      border: Border.all(color: Colors.grey.shade300),
                                    ),
                                  ),
                                ),
                              ),
                            const SizedBox(height: 8),
                            if (balanceHistory.isNotEmpty) 
                              Text(
                                'Kontostand-Entwicklung der letzten ${balanceHistory.length} Monate',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                                textAlign: TextAlign.center,
                              ),
                          ],
                        ),
                      ),
                    ),
                    
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
