# MetaCent

MetaCent is a comprehensive personal financial management application built with Flutter. It allows users to track various account types, manage budgets, monitor monthly balances, and track financial transactions.

## Overview

MetaCent is designed to provide a simple yet powerful budgeting and financial tracking system with the following capabilities:

- Account management across multiple categories
- Budget planning and tracking
- Monthly financial overview
- Transaction recording and monitoring
- Cross-platform support (Windows, iOS, Android, macOS, Linux)

## Features

### Account Management
- Create and manage different account types:
  - Money accounts (busy and idle)
  - Physical assets
  - Budget accounts (fixed, variable, and provisions)
  - Credit accounts
- Organize accounts in custom groups
- Track account balances
- Set budget goals and monthly normalized budgets

### Monthly Balance Tracking
- View monthly balances for all accounts
- Compare actual balances against budget goals
- Monitor trends over time
- Manage budgets on a monthly basis

### Transaction Management
- Record various transaction types:
  - Initial balances
  - Budget assignments
  - Budget carryovers
  - Balance updates
  - Transfers between accounts
  - Expenses and income
- Associate transactions with specific months
- Detailed transaction history

### Monthly Overview
- Consolidated view of financial status by month
- Visual representation of budget usage
- Comparison of actuals vs. planned budgets

## Technical Architecture

### Technology Stack
- **Frontend**: Flutter with Material 3 design
- **Backend**: Local SQLite database
- **Database Access**: sqflite and sqflite_common_ffi
- **Platform Support**: Cross-platform (Windows, iOS, Android, macOS, Linux)

### Data Models
- **Account**: Represents various financial accounts with types, groups, and budget goals
- **Transaction**: Records financial transactions with type, amount, and dates
- **MonthlyBalance**: Tracks the balance and budget for each account by month

### Database Structure
- Accounts table: Stores account details, types, and budget information
- Monthly balances table: Tracks balances and budgets by month for each account

## Getting Started

### Prerequisites
- Flutter SDK (>= 3.2.3)
- Dart SDK (>= 3.2.3)
- Development environment for target platforms (Android Studio, Xcode, etc.)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   flutter pub get
   ```
3. Run the application:
   ```
   flutter run
   ```

### Usage

1. **Account Setup**:
   - Create accounts by tapping the "+" button on the Accounts screen
   - Configure account type, group, budget goals, and description

2. **Monthly Balance Management**:
   - Navigate to the Monthly Overview screen
   - Update account balances for the month
   - Compare against budget goals

3. **Transaction Recording**:
   - Select an account to view its transaction history
   - Use the "+" button to add new transactions
   - Choose the appropriate transaction type
   - Specify amount, date, and description

## Development

The application follows a standard Flutter project structure:
- `lib/models/`: Data models (Account, Transaction, MonthlyBalance)
- `lib/screens/`: UI screens for different application features
- `lib/database/`: Database configuration and helper functions
- `lib/main.dart`: Application entry point and navigation setup

## License

This project is intended for personal use only. All rights reserved.
