import 'package:flutter/material.dart';
import '../models/account.dart';
import '../database/database_helper.dart';

class AccountMasterDataScreen extends StatefulWidget {
  final Account? account;
  final List<String> existingGroups;
  
  const AccountMasterDataScreen({
    super.key, 
    this.account,
    required this.existingGroups,
  });

  @override
  State<AccountMasterDataScreen> createState() => _AccountMasterDataScreenState();
}

class _AccountMasterDataScreenState extends State<AccountMasterDataScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _accountNameController;
  late final TextEditingController _accountGroupController;
  late final TextEditingController _budgetGoalController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _monthlyBudgetController;
  late AccountType _selectedType;
  late List<String> _existingGroups;

  @override
  void initState() {
    super.initState();
    // Initialisiere Controller mit vorhandenen Werten oder leer
    _accountNameController = TextEditingController(text: widget.account?.accountName ?? '');
    _accountGroupController = TextEditingController(text: widget.account?.accountGroup ?? '');
    _budgetGoalController = TextEditingController(
      text: widget.account?.budgetGoal.toString() ?? '',
    );
    _descriptionController = TextEditingController(text: widget.account?.description ?? '');
    _monthlyBudgetController = TextEditingController(
      text: widget.account?.monthlyNormalizedBudget.toString() ?? '',
    );
    _selectedType = widget.account?.accountType ?? AccountType.moneyBusy;
    _existingGroups = List.from(widget.existingGroups);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.account == null ? 'Neues Sachkonto' : 'Sachkonto bearbeiten'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _accountNameController,
                decoration: const InputDecoration(
                  labelText: 'Kontoname',
                  helperText: 'Frei wählbarer Name für das Konto',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Bitte geben Sie einen Kontonamen ein';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 8),
              Autocomplete<String>(
                optionsBuilder: (TextEditingValue textEditingValue) {
                  if (textEditingValue.text.isEmpty) {
                    return _existingGroups;
                  }
                  return _existingGroups.where((group) =>
                      group.toLowerCase().contains(textEditingValue.text.toLowerCase()));
                },
                onSelected: (String selection) {
                  setState(() {
                    _accountGroupController.text = selection;
                  });
                },
                fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
                  // Synchronisiere den Controller mit dem Autocomplete-Widget
                  textEditingController.text = _accountGroupController.text;
                  return TextFormField(
                    controller: textEditingController,
                    focusNode: focusNode,
                    onChanged: (value) {
                      _accountGroupController.text = value;
                    },
                    decoration: const InputDecoration(
                      labelText: 'Kontogruppe',
                      helperText: 'Frei definierbares Feld mit Autovervollständigung',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Bitte geben Sie eine Kontogruppe ein';
                      }
                      return null;
                    },
                  );
                },
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<AccountType>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Kontotyp',
                  helperText: ' ',
                ),
                items: AccountType.values.map((AccountType type) {
                  String displayName = switch (type) {
                    AccountType.moneyBusy => 'Money Busy',
                    AccountType.moneyIdle => 'Money Idle',
                    AccountType.physical => 'Physical',
                    AccountType.budgetFix => 'Budget Fix',
                    AccountType.budgetVariable => 'Budget Variable',
                    AccountType.budgetProvisions => 'Budget Provisions',
                    AccountType.moneyCredit => 'Money Credit',
                  };
                  return DropdownMenuItem<AccountType>(
                    value: type,
                    child: Text(displayName),
                  );
                }).toList(),
                onChanged: (AccountType? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _selectedType = newValue;
                    });
                  }
                },
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _budgetGoalController,
                decoration: const InputDecoration(
                  labelText: 'Budgetziel',
                  helperText: ' ',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Bitte geben Sie ein Budgetziel ein';
                  }
                  if (double.tryParse(value) == null) {
                    return 'Bitte geben Sie eine gültige Zahl ein';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 8),
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
              const SizedBox(height: 8),
              TextFormField(
                controller: _monthlyBudgetController,
                decoration: const InputDecoration(
                  labelText: 'Budget monatlich normalisiert',
                  helperText: ' ',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Bitte geben Sie ein monatliches Budget ein';
                  }
                  if (double.tryParse(value) == null) {
                    return 'Bitte geben Sie eine gültige Zahl ein';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Expanded(
                    flex: 4,
                    child: ElevatedButton(
                      onPressed: _saveAccount,
                      child: const Text('Speichern'),
                    ),
                  ),
                  if (widget.account?.id != null) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 1,
                      child: ElevatedButton(
                        onPressed: _deleteAccount,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                        ),
                        child: const Icon(Icons.delete),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _saveAccount() {
    if (_formKey.currentState!.validate()) {
      try {
        // Konvertiere Textfelder zu den richtigen Datentypen
        final budgetGoal = double.tryParse(_budgetGoalController.text) ?? 0.0;
        final monthlyBudget = double.tryParse(_monthlyBudgetController.text) ?? 0.0;
        
        final account = Account(
          id: widget.account?.id,
          accountName: _accountNameController.text.trim(),
          accountGroup: _accountGroupController.text.trim(),
          accountType: _selectedType,
          budgetGoal: budgetGoal,
          description: _descriptionController.text.trim(),
          monthlyNormalizedBudget: monthlyBudget,
        );
        
        // Add debug print to verify account data
        print('Saving account: ${account.accountName}, ${account.description}');
        print('Account data before returning: ${account.toJson()}');
        
        // Ensure we're returning the account object to the previous screen
        Navigator.pop(context, account);
      } catch (e) {
        print('Error creating account object: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler beim Erstellen des Kontos: $e')),
        );
      }
    } else {
      print('Form validation failed');
    }
  }

  void _deleteAccount() {
    // Bestätigungsdialog anzeigen
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konto löschen'),
        content: Text(
          'Möchten Sie das Konto "${widget.account?.accountName}" wirklich löschen?\n\n'
          'Alle zugehörigen Kontostände und Transaktionen werden ebenfalls gelöscht. '
          'Diese Aktion kann nicht rückgängig gemacht werden.'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Abbrechen'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context); // Dialog schließen
              
              // Konto löschen
              final dbHelper = DatabaseHelper.instance;
              final result = await dbHelper.deleteAccount(widget.account?.id);
              
              if (result > 0) {
                // Erfolgreich gelöscht
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Konto erfolgreich gelöscht')),
                  );
                  // Zurück zur Kontoliste mit einem speziellen Ergebnis, das anzeigt, dass das Konto gelöscht wurde
                  Navigator.pop(context, 'deleted');
                }
              } else {
                // Fehler beim Löschen
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Fehler beim Löschen des Kontos')),
                  );
                }
              }
            },
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Löschen'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _accountNameController.dispose();
    _accountGroupController.dispose();
    _budgetGoalController.dispose();
    _descriptionController.dispose();
    _monthlyBudgetController.dispose();
    super.dispose();
  }
}
