import 'package:flutter/material.dart';
import '../models/account.dart';
import '../database/database_helper.dart';
import 'account_master_data.dart';

class AccountListScreen extends StatefulWidget {
  const AccountListScreen({super.key});

  @override
  State<AccountListScreen> createState() => _AccountListScreenState();
}

class _AccountListScreenState extends State<AccountListScreen> {
  List<Account> accounts = [];
  List<String> existingGroups = [];
  final dbHelper = DatabaseHelper.instance;

  @override
  void initState() {
    super.initState();
    _loadAccounts();
  }

  Future<void> _loadAccounts() async {
    final loadedAccounts = await dbHelper.getAllAccounts();
    final loadedGroups = await dbHelper.getAllAccountGroups();
    
    // Add debug print to verify loaded accounts
    print('Loaded ${loadedAccounts.length} accounts from database');
    for (var account in loadedAccounts) {
      print('Account: ${account.accountName}, ${account.description}');
    }
    
    setState(() {
      accounts = loadedAccounts;
      existingGroups = loadedGroups;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sachkonten'),
      ),
      body: accounts.isEmpty
          ? const Center(
              child: Text(
                'Keine Sachkonten vorhanden\nKlicken Sie auf + um ein neues Konto anzulegen',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
            )
          : ListView.builder(
              itemCount: accounts.length,
              itemBuilder: (context, index) {
                final account = accounts[index];
                return ListTile(
                  title: Text(account.accountName),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(account.description),
                      const SizedBox(height: 4),
                      Text(
                        'Kontogruppe: ${account.accountGroup}',
                        style: const TextStyle(fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Typ: ${account.accountType.toString().split('.').last}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                  isThreeLine: true,
                  onTap: () => _editAccount(account),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createNewAccount,
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _createNewAccount() async {
    final result = await Navigator.push<Account>(
      context,
      MaterialPageRoute(
        builder: (context) => AccountMasterDataScreen(
          existingGroups: existingGroups,
        ),
      ),
    );

    if (result != null) {
      try {
        // Überprüfen, ob ein Konto mit diesem Namen bereits existiert
        final exists = await dbHelper.accountNameExists(result.accountName);
        if (exists) {
          print('Account with name ${result.accountName} already exists');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Fehler: Ein Konto mit dem Namen ${result.accountName} existiert bereits')),
          );
          return;
        }
        
        // Konto erstellen
        final createResult = await dbHelper.createAccount(result);
        print('Create result: $createResult');
        
        if (createResult > 0) {
          // Erfolgreiche Erstellung
          print('Account successfully created');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Konto erfolgreich erstellt')),
          );
        } else {
          // Fehler beim Erstellen
          print('Error creating account, result: $createResult');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Fehler beim Erstellen des Kontos')),
          );
        }
      } catch (e) {
        print('Error during account creation: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler beim Erstellen des Kontos: $e')),
        );
      } finally {
        // Lade die Liste neu
        await _loadAccounts();
      }
    }
  }

  Future<void> _editAccount(Account account) async {
    // Überprüfen, ob das Konto existiert, bevor wir es bearbeiten
    final exists = await dbHelper.accountExists(account.id);
    if (!exists) {
      print('Account ${account.accountName} (ID: ${account.id}) does not exist in database');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fehler: Konto ${account.accountName} existiert nicht in der Datenbank')),
      );
      await _loadAccounts(); // Liste neu laden, um sicherzustellen, dass sie aktuell ist
      return;
    }
    
    final result = await Navigator.push<dynamic>(
      context,
      MaterialPageRoute(
        builder: (context) => AccountMasterDataScreen(
          account: account,
          existingGroups: existingGroups,
        ),
      ),
    );

    if (result == 'deleted') {
      // Konto wurde gelöscht, Liste neu laden
      print('Account was deleted, reloading list');
      await _loadAccounts();
      return;
    } else if (result != null) {
      // Account-Objekt zurückgegeben, Konto aktualisieren
      final accountResult = result as Account;
      
      // Add debug print to verify returned account data
      print('Account returned from edit: ${accountResult.accountName}, ${accountResult.description}');
      print('Original account: ${account.accountName}, ${account.description}');
      
      try {
        // Überprüfen, ob ein anderes Konto mit dem gleichen Namen existiert (außer dem aktuellen)
        final nameExists = await dbHelper.accountNameExistsExcept(accountResult.accountName, accountResult.id!);
        if (nameExists) {
          print('Another account with name ${accountResult.accountName} already exists');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Fehler: Ein anderes Konto mit dem Namen ${accountResult.accountName} existiert bereits')),
          );
          return;
        }
        
        // Überprüfen, ob das Konto noch existiert
        final stillExists = await dbHelper.accountExists(accountResult.id);
        if (!stillExists) {
          print('Account ${accountResult.accountName} (ID: ${accountResult.id}) no longer exists in database');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Fehler: Konto ${accountResult.accountName} existiert nicht mehr in der Datenbank')),
          );
          await _loadAccounts();
          return;
        }
        
        // Update the account in the database
        final updateResult = await dbHelper.updateAccount(accountResult);
        print('Update result: $updateResult'); // 1 means success, 0 means no rows affected
        
        if (updateResult > 0) {
          // Erfolgreiche Aktualisierung
          print('Account successfully updated');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Konto erfolgreich aktualisiert')),
          );
        } else {
          // Keine Zeilen aktualisiert
          print('No rows updated, possibly account not found');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Fehler beim Aktualisieren des Kontos: Konto nicht gefunden')),
          );
        }
      } catch (e) {
        print('Error during account update: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler beim Aktualisieren des Kontos: $e')),
        );
      } finally {
        // Reload the accounts list regardless of success or failure
        await _loadAccounts();
      }
    }
  }
}
