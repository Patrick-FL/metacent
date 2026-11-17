# User Stories

> Organized by theme. Each story follows: *As a [role], I want [goal] so that [benefit].*
> Acceptance criteria are listed as checkboxes.

---

## Theme 1: Budget Planning

### US-BP-01: View Monthly Budget
**As a** budgeter, **I want to** see my budget for a specific month **so that** I know how my money is allocated.

- [ ] The planning view shows the selected month (e.g., "Nov 2026") with a month selector/dropdown
- [ ] Categories are grouped under collapsible Category Groups (Bills, Needs, Wants)
- [ ] Each category row shows: Category name (with emoji icon), Assigned, Activity, Available
- [ ] Category Group rows show summed totals for Assigned, Activity, and Available
- [ ] The "Ready to Assign" banner at the top shows the total unassigned money
- [ ] I can navigate between months using the month selector

### US-BP-02: Assign Money to Categories
**As a** budgeter, **I want to** assign money to categories **so that** every dollar has a job.

- [ ] I can click on a category's Assigned cell and type an amount
- [ ] Assigning money decreases Ready to Assign in real time
- [ ] Assigning money increases the category's Available balance in real time
- [ ] I can use math operators (+, −, ×, ÷) in the input field for quick calculations
- [ ] Changes are reflected immediately without a save button
- [ ] Undo (Ctrl+Z) and Redo (Ctrl+Shift+Z) work for assignment changes

### US-BP-03: Over-Assignment Warning
**As a** budgeter, **I want to** be warned when I assign more money than I have **so that** I don't create an unrealistic budget.

- [ ] When Ready to Assign goes negative, a warning banner appears (e.g., "−$700.00 You assigned more than you have")
- [ ] The warning includes a "Fix This" button
- [ ] The "Fix This" action helps me identify and resolve over-assignment
- [ ] The warning is visually distinct (red/orange) and impossible to miss

### US-BP-04: Create and Manage Category Groups
**As a** budgeter, **I want to** create, rename, reorder, and delete category groups **so that** I can organize my budget to match my life.

- [ ] A "+ Category Group" button is available at the bottom of the category list
- [ ] I can rename a category group by clicking its name
- [ ] I can collapse/expand groups with Ctrl+↑ and Ctrl+↓
- [ ] I can reorder category groups via drag-and-drop
- [ ] Deleting a group requires confirmation and handles contained categories

### US-BP-05: Create and Manage Categories
**As a** budgeter, **I want to** add, rename, and remove categories **so that** my budget reflects my actual spending areas.

- [ ] Each category group has an "Add Category" button
- [ ] New categories are created with a name and optional emoji icon
- [ ] I can rename a category by clicking its name
- [ ] I can move a category between groups
- [ ] I can delete a category (with confirmation if it has transactions or a balance)
- [ ] I can navigate categories with ↑/↓ arrow keys
- [ ] I can multi-select categories with Shift+↑/↓

### US-BP-06: Set Category Targets
**As a** budgeter, **I want to** set funding targets on categories **so that** I know how much I need to assign each month.

- [ ] Selecting a category opens a detail panel on the right
- [ ] I can set a target type: Weekly, Monthly, Yearly, or Custom frequency
- [ ] I can set a "needed by date" target: "I need $X.XX by [date]"
- [ ] I can set a savings builder target: "Next year I want to set aside another $X.XX"
- [ ] When a category is underfunded relative to its target, a clock icon and "more needed this month" message appear
- [ ] I can snooze a target warning with Shift+Z

### US-BP-07: View Category Detail
**As a** budgeter, **I want to** see detailed information about a selected category **so that** I can understand its history and target progress.

- [ ] Clicking a category opens a right-side detail panel
- [ ] The panel shows the category name, assigned amount, activity, and available balance
- [ ] If a target is set, progress toward the target is shown
- [ ] Recent transactions against the category are listed
- [ ] I can edit the target from the detail panel

---

## Theme 2: Account Management

### US-AM-01: Add an Account
**As a** user, **I want to** add a new financial account **so that** I can track its balance and transactions.

- [ ] An "Add Account" button is visible in the sidebar
- [ ] Clicking it opens an "Add Unlinked Account" wizard
- [ ] The wizard asks for: Account Nickname, Account Type, Current Balance
- [ ] Account types are organized: Cash Accounts (Checking, Savings, Cash), Credit Accounts (Credit Card, Line of Credit), Mortgages & Loans (Mortgage, Auto Loan, etc.)
- [ ] On creation, a Starting Balance transaction is automatically created as "Inflow: Ready to Assign"
- [ ] The new account appears in the sidebar grouped by type with its balance

### US-AM-02: View Account List
**As a** user, **I want to** see all my accounts in the sidebar **so that** I can quickly check balances and navigate.

- [ ] Accounts are grouped by type (e.g., "CASH", "CREDIT") in the sidebar
- [ ] Each account shows its name and current Working Balance
- [ ] The "All Accounts" link shows the combined view
- [ ] Account balances update in real time as transactions are added

### US-AM-03: Edit an Account
**As a** user, **I want to** edit account details **so that** I can fix mistakes or update information.

- [ ] I can open an Edit Account modal from the account view
- [ ] I can change: Account Nickname, Account Notes
- [ ] I can adjust the Working Balance (which creates an adjustment transaction)
- [ ] I can link/unlink a bank connection
- [ ] I can delete the account (with confirmation)

### US-AM-04: View Account Transactions
**As a** user, **I want to** see all transactions in an account **so that** I can review my financial activity.

- [ ] Clicking an account in the sidebar opens the transaction register
- [ ] The register header shows: Account name, star (favorite), account type badge, reconciliation status
- [ ] Balance display shows: Cleared Balance + Uncleared Balance = Working Balance
- [ ] Transactions are listed in a table: checkbox, approved/flag icons, Date, Payee, Category, Memo, Outflow, Inflow
- [ ] The Starting Balance transaction appears as the first entry
- [ ] A search field allows filtering transactions
- [ ] A "View options" dropdown allows customizing the display

---

## Theme 3: Transaction Management

### US-TM-01: Add a Transaction
**As a** user, **I want to** manually enter a transaction **so that** my budget reflects real spending.

- [ ] An "Add Transaction" button is in the account action bar
- [ ] Keyboard shortcut: Shift+N
- [ ] An inline form appears with fields: Date, Payee, Category, Memo, Outflow/Inflow
- [ ] The Date defaults to the current date and can be changed by picking a date in the calendar pop up or by typing "t" for today or "y" for yesterday
- [ ] The Date picker has an option at the bottom to make it a recurring transaction (Weekly, Monthly, Quarterly, Yearly, Custom frequency)
- [ ] The Payee field supports autocomplete from existing payees
- [ ] The Category field supports autocomplete from existing categories
- [ ] The Memo field is optional
- [ ] All fields are editable inline within the transaction table
- [ ] A "Save" button confirms the entry
- [ ] A "Save and add another" button confirms and immediately opens a new entry form
- [ ] Tab and Shift+Tab navigate between fields
- [ ] The transaction appears immediately in the register
- [ ] The account's Working Balance updates in real time
- [ ] The category's Activity and Available update in real time

### US-TM-02: Edit a Transaction
**As a** user, **I want to** edit an existing transaction **so that** I can correct mistakes.

- [ ] Clicking a transaction row opens it for inline editing
- [ ] All fields (Date, Payee, Category, Memo, Outflow, Inflow) are editable
- [ ] Changes are saved on confirmation
- [ ] Undo (Ctrl+Z) reverts the edit
- [ ] Balance and category amounts update in real time

### US-TM-03: Delete a Transaction
**As a** user, **I want to** delete a transaction **so that** I can remove errors.

- [ ] I can select one or more transactions using checkboxes or Shift+click
- [ ] Pressing Delete removes the selected transaction(s)
- [ ] Deletion can be undone with Ctrl+Z
- [ ] Balances update immediately

### US-TM-04: Approve and Categorize Transactions
**As a** user, **I want to** approve imported transactions and assign categories **so that** my budget stays accurate.

- [ ] Unapproved transactions are visually distinct
- [ ] Pressing A approves the selected transaction
- [ ] Pressing Shift+L approves all unapproved transactions
- [ ] Pressing Shift+R rejects a transaction
- [ ] Pressing K opens category selection for quick categorization
- [ ] Pressing S splits a transaction across multiple categories

### US-TM-05: Flag Transactions
**As a** user, **I want to** flag transactions with colors **so that** I can organize and find them later.

- [ ] Pressing Shift+F followed by a number (0–6) sets a colored flag
- [ ] Flag 0 removes the flag
- [ ] Flags are visible as colored icons in the transaction row
- [ ] I can filter by flag color

### US-TM-06: Clear Transactions
**As a** user, **I want to** mark transactions as cleared **so that** I know which ones have been processed by my bank.

- [ ] Pressing C toggles the cleared status of a transaction
- [ ] Cleared transactions show a checkmark icon
- [ ] The Cleared Balance and Uncleared Balance update in real time

### US-TM-07: Duplicate a Transaction
**As a** user, **I want to** duplicate a transaction **so that** I can quickly enter similar recurring expenses.

- [ ] Pressing Shift+D creates a copy of the selected transaction with today's date
- [ ] The duplicate appears in the register for editing

### US-TM-08: Make a Transaction Repeating
**As a** user, **I want to** set a transaction to repeat **so that** recurring expenses are entered automatically.

- [ ] Pressing Shift+T opens repeating transaction configuration
- [ ] I can set frequency (weekly, biweekly, monthly, etc.)
- [ ] Repeating transactions are auto-entered on their scheduled dates
- [ ] Pressing E enters a scheduled transaction now

### US-TM-09: Match Transactions
**As a** user, **I want to** match manually entered transactions with imported ones **so that** there are no duplicates.

- [ ] Pressing M matches the selected transaction with a suggested import
- [ ] Pressing Shift+U unmatches a previously matched transaction
- [ ] The system suggests matches based on amount, date, and payee

---

## Theme 4: Reporting & Reflection

### US-RR-01: View Spending Breakdown
**As a** budgeter, **I want to** see a breakdown of my spending by category or group **so that** I understand where my money goes.

- [ ] The Reflect section has a "Spending Breakdown" tab
- [ ] A donut chart visualizes spending proportions
- [ ] I can toggle between "by Categories" and "by Groups" views
- [ ] A sidebar list shows each category/group with amounts
- [ ] I can filter by month, specific categories, and specific accounts
- [ ] I can navigate between months with prev/next controls
- [ ] An export button allows downloading the report data

### US-RR-02: View Spending Trends
**As a** budgeter, **I want to** see how my spending changes over time **so that** I can identify patterns.

- [ ] A line chart shows spending trends across months
- [ ] Average Monthly Spending and Total Spending summaries are displayed
- [ ] A month-over-month table shows actual amounts with a "Compared to Average" column
- [ ] Filters for categories and accounts are available
- [ ] Month navigation (prev/next) is available
- [ ] An export button is available

### US-RR-03: Track Net Worth
**As a** budgeter, **I want to** see my net worth over time **so that** I can measure my overall financial progress.

- [ ] A bar chart shows Assets (blue) and Debts (red) by month
- [ ] The current Net Worth total is prominently displayed
- [ ] Change in Net Worth is shown as both an amount and a percentage
- [ ] A monthly table shows balances with a "Monthly Change" column
- [ ] A "Share Your Progress" button allows exporting/sharing the net worth chart
- [ ] Filters for categories and accounts are available
- [ ] Month navigation and export are available

### US-RR-04: View Income vs. Expense
**As a** budgeter, **I want to** compare my income to my expenses **so that** I know if I'm living within my means.

- [ ] A table format shows Income section (all sources, total) and Expense section (total)
- [ ] Net Income is calculated: Total Income − Total Expenses
- [ ] Columns show specific months, Average, and Total
- [ ] Filters for categories and accounts are available
- [ ] Month navigation and export are available

### US-RR-05: View Age of Money
**As a** budgeter, **I want to** see my Age of Money **so that** I know if I'm breaking the paycheck-to-paycheck cycle.

- [ ] The Age of Money metric is displayed in the Reflect section
- [ ] The calculation requires at least 10 outflow transactions
- [ ] Before 10 transactions, a message explains the requirement
- [ ] A higher number indicates more financial stability
- [ ] The trend over time is visible

---

## Theme 5: Data Import

### US-DI-01: Import Transactions from File
**As a** user, **I want to** import transactions from a bank-exported file **so that** I don't have to enter every transaction manually.

- [ ] A "File Import" button is in the account action bar
- [ ] Clicking it opens a modal dialog
- [ ] Recommended formats: OFX, QFX
- [ ] Supported formats: QIF, CSV
- [ ] The modal explains which formats are recommended and why
- [ ] After selecting a file, transactions are parsed and presented for review
- [ ] Imported transactions start as unapproved

### US-DI-02: Duplicate Detection on Import
**As a** user, **I want to** avoid duplicate transactions when importing **so that** my records stay accurate.

- [ ] Manually entered transactions are automatically matched with imported ones
- [ ] Direct Import duplicates are skipped entirely
- [ ] The import summary shows how many transactions were imported, matched, and skipped
- [ ] The user is informed: "Transactions entered by you will match automatically. Direct Import duplicates are skipped."

### US-DI-03: Reconcile an Account
**As a** user, **I want to** reconcile my account **so that** I can verify my records match my bank.

- [ ] A "Reconcile" button is available in the account view
- [ ] Keyboard shortcut: Shift+E
- [ ] The reconciliation prompt asks: "Is your current balance $X.XX?"
- [ ] I can confirm (Yes) or deny (No)
- [ ] On confirmation, all cleared transactions are locked
- [ ] A help link "How do I find my account balance?" is provided
- [ ] The reconciliation status is shown in the account header

---

## Theme 6: Navigation & Keyboard Shortcuts

### US-NK-01: Sidebar Navigation
**As a** user, **I want to** navigate between sections using the sidebar **so that** I can quickly switch contexts.

- [ ] The sidebar shows: Plan, Reflect, All Accounts
- [ ] Below All Accounts, individual accounts are listed grouped by type with balances
- [ ] An "Add Account" button is at the bottom of the account list

### US-NK-02: Comprehensive Keyboard Shortcuts
**As a** power user, **I want to** use keyboard shortcuts for all common actions **so that** I can work quickly without a mouse.

- [ ] Pressing ? shows the full keyboard shortcuts reference
- [ ] Universal shortcuts work everywhere: Escape, Ctrl+Z, Ctrl+Shift+Z, Ctrl+A, math operators
- [ ] Plan-specific shortcuts: Shift+Z (snooze), Ctrl+↑/↓ (collapse/expand), ↑/↓ (navigate), Shift+↑/↓ (multi-select)
- [ ] Account-specific shortcuts: Shift+N (add), A (approve), Shift+L (approve all), Shift+R (reject), K (categorize), S (split), E (enter now), M (match), Shift+U (unmatch), C (clear), Shift+D (duplicate), Shift+F+0–6 (flag), Shift+T (repeating), Delete (delete), Shift+E (reconcile), Ctrl+Shift+F (search), Tab/Shift+Tab (fields)
- [ ] Date picker shortcuts: arrows, +/− (day), T (today), M/Shift+M (month start/end), Y/Shift+Y (year start/end)

### US-NK-03: Undo and Redo
**As a** user, **I want to** undo and redo any action **so that** I can freely experiment without fear of mistakes.

- [ ] Ctrl+Z undoes the last action
- [ ] Ctrl+Shift+Z redoes the last undone action
- [ ] Undo/Redo buttons are visible in the toolbar
- [ ] Undo works for: assignments, transaction edits, transaction creation, transaction deletion, category changes
- [ ] The undo stack is per-session

---

## Theme 7: KI-Finanzberater & Ziel-Copilot

### US-AI-01: KI-Ausgaben-Audit auf Knopfdruck starten
**As a** budgeter, **I want to** trigger a deep AI analysis of my historical spending patterns on demand **so that** I can uncover recurring inefficiencies, hidden subscriptions, and creep in discretionary spending.

- [ ] An "Ausgaben analysieren" action is accessible in Plan, Reflect, and the AI Advisor view
- [ ] The audit analyzes recurring transactions, variances across 3/6/12 months, and category drifts
- [ ] Insights are classified into impact tiers (e.g. Fixkosten-Optimierung, Abonnements, Flexible Ausgaben)
- [ ] The analysis highlights both potential savings and positive spending habits
- [ ] If transaction history is under 1 month, a helpful guidance state explains what data is needed

### US-AI-02: Interaktive Szenario-Simulation & Was-wäre-wenn
**As a** budgeter, **I want to** interactively simulate what happens if I reduce spending in specific areas **so that** I see exactly how much faster I can reach my personal targets and wishes.

- [ ] Interactive sliders/levers allow adjusting monthly spending in proposed categories
- [ ] Real-time recalculated metrics show the accelerated completion date for active targets
- [ ] A comparative timeline visualizes "Baseline vs. Mit Sparhebel" (e.g. Ziel erreicht im Aug 2027 statt Nov 2027)
- [ ] Changes in the simulator are non-destructive and only apply to the live budget when confirmed with "In Budget übernehmen"

### US-AI-03: Anonymisierte Web-Preisrecherche & Alternativen-Vorschläge
**As a** budgeter, **I want** the AI agent to research current market prices and alternatives on the web for my regular contracts and planned target purchases **so that** I can save money without sacrificing quality.

- [ ] The agent identifies candidate expenses (e.g. mobile plans, internet/DSL, electricity, streaming, gym)
- [ ] Before querying the web, a strict privacy firewall strips all PII (names, IBANs, exact notes, account numbers)
- [ ] Search queries are strictly generic (e.g. "Mobilfunk 20GB Allnet Flat Deutschland Vergleich monatlich kündbar")
- [ ] The agent presents concrete alternatives with verified provider names, monthly prices, feature parity, and estimated annual savings
- [ ] The user can view the search term used and inspect the privacy boundary

### US-AI-04: Ziel-Konkretisierung & SMART-Ziele definieren
**As a** budgeter, **I want to** enter vague wishes or broad dreams into the AI Copilot **so that** the assistant helps me break them down into concrete, actionable SMART budget targets.

- [ ] An interactive dialog guides me from a vague wish (e.g. "Ich will eine längere Reise machen") to concrete parameters (Zielbetrag, Zeitrahmen, monatliche Sparrate)
- [ ] The agent performs market benchmark queries for cost estimation if requested (e.g. durchschnittliche Kosten für 3 Wochen Rundreise in Land X)
- [ ] The resulting target integrates directly into metacent's envelope target engine (Target Balance by Date)
- [ ] The agent suggests realistic milestone breakdowns (z.B. Flüge im Monat X buchen, Restbetrag bis Monat Y ansparen)

### US-AI-05: Ziel-Priorisierung & Konflikt-Auflösung
**As a** budgeter, **I want** supportive assistance when I have multiple competing goals and limited monthly cashflow **so that** I can order my priorities without feeling overwhelmed or judged.

- [ ] The AI evaluates available monthly savings against all active target due dates
- [ ] If targets exceed available monthly capacity ("Underfunded targets conflict"), the AI detects the bottleneck
- [ ] The AI presents empathetic comparison questions (z.B. "Wie wichtig ist dir der Notgroschen-Puffer im Vergleich zum neuen E-Bike?")
- [ ] The AI suggests tiered prioritization strategies (z.B. Notgroschen absichern $\to$ Fixkosten-Sinking-Funds $\to$ Urlaub $\to$ Luxuswünsche)
- [ ] The user can accept, adjust, or reorder target priorities with one click

### US-AI-06: Nicht-bevormundende Beratungs-Interaktion & geschützte Kategorien
**As a** budgeter, **I want** the AI assistant to always communicate supportively and objectively without moralizing or lecturing **so that** I feel empowered and remain in full control of my financial decisions.

- [ ] Tone guardrails ensure language is always advisory, respectful, and free of judgmental words ("solltest", "musst", "überflüssig", "Verschwendung")
- [ ] I can flag any category as "Geschützte Lebensqualität" (Protected from Cuts) so the AI never suggests reducing it
- [ ] The AI acknowledges and respects my personal values and subjective lifestyle choices
- [ ] Every suggestion includes a dismiss option ("Kein Interesse") that immediately trains future recommendations

