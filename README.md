# ACTUAL_MINT_IMPORTER

This importer will import CSV exports from Mint.com into Actual Budget.

Mint doesn't export any budget data so you will need to setup the budgets yourself.

# Run

1. Setup Actual how you like. You need an instance of actual-server running for the importer to access.
2. Create a new budget file and leave it empty.  Don't encrypt the file yet, the script isn't setup to open those.
3. Follow either the [local git checkout](#local-git-checkout) or the [docker](#docker) instructions.

The importer does the following:
* All categories listed in the CSV export will be created under a category group "Mint Import"

## Local Git Checkout

You need to have Node.js installed.

1. Clone this repo, and cd into it
2. Store csv file in this directory that you exported from Mint.com
3. run `npm install`.  (I tested with node18)
4. Find all the [configuration](#configuration) to match your setup. Provide them in the next step.
5. run `ACTUAL_SERVER_PASSWORD="your-password" ACTUAL_SYNC_ID="your-sync-id" node mint.js`

## Docker

You need to have docker engine or docker desktop installed.

1. Build the docker image locally
   * `docker build -t actual_mint_importer https://github.com/youngcw/actual_mint_importer.git`
2. Navigate to the directory that you stored the Mint.com exported csv from
3. Find all the [configuration](#configuration) to match your setup. Provide them in the next step.
4. Run `docker run -e ACTUAL_SERVER_PASSWORD=your-password -e ACTUAL_SYNC_ID=your-sinc-id -e ACTUAL_SERVER_URL=your-server-url -v ./transaction.csv:/data/transactions.csv actual_mint_importer`
   * Note that the server url can't be passed as localhost or 127.0.0.1 to the docker container. So you will want to use an accessible IP of your server instead.
   * If your transaction file is named differently, change `./transaction.csv` in the command above to match.

## Configuration

The following environment variables are available.

| Name | Description | Default |
| ---- | ----------- | ------- |
| ACTUAL_SERVER_URL | url of your server that the script can use to access your budget files. For self-signed https servers also use [NODE_TLS_REJECT_UNAUTHORIZED=0](https://nodejs.org/api/cli.html#node_tls_reject_unauthorizedvalue) | `http://localhost:5006`
| ACTUAL_SERVER_PASSWORD | password of your server | |
| ACTUAL_SYNC_ID | The sync_id from your budget file.  That can be found in settings->Advanced Settings->IDs, looks something like 'ace017dc-ee96-4b24-a1f4-e6db10c96e53' | |
| IMPORTER_INFILE | path to mint transaction file | `transactions.csv` |
| IMPORTER_CACHE_DIR | this is where the budget file will be stored during the import. | `./cache` |
| IMPORTER_INCOME_CATEGORIES | comma separated list of categories to consider as income to budget | `Paycheck,Investment,Returned Purchase,Bonus,Interest Income,Reimbursement,Rental Income`
| IMPORTER_EXTRA_INCOME_CATEGORIES | comma separated list of extra categories to add the default list | |

# Budget Options

## Report Budget

One option is to use the Report Budget in Actual.  That is a more traditional budget style and more in line with Mint. The data will look much more clean in the budget, but I recommend the other budget style as I find it more useful.  To use the Report Budget you need to enable it under Settings->Advanced Settings->Experimental Features->Budget Mode Toggle

## Rollover Budget (recommended)

If you elect to use the default Rollover Budget (my recommended one) your imported data will cause really messy balances for prior months.  As I see it your options to use this style are to (sorted by expected difficulty)

1. Use a report budget to store the old data and start fresh in a new file moving forward. I would do this because most people seldom look at their old data, and I find zero-based budgeting much more useful.  You can always open the file of the old data and run reports on that if you want.
2. [Do your best to start from the current month and ignore old ones](#ignoring-budgets-for-previous-months).  It may take some transaction trickery to do this.
3. Do what it takes to clean up the old months.  May be hard if you have have years of data

### Ignoring budgets for previous months

This method of using the rollover budget allows you to keep all your mint previous months mint transactions in your accounts, while only worrying about budget data from the current month forward.

You can follow these steps once your import is complete.

1. In the Budgets screen, navigate to the very first month that you have transactions for.
2. Set each category to rollover overspending.
   * For each category. Click the "Balance" value field (even if it's 0.00). A dropdown will open.
   * Select "Rollover Overspending"
3. Navigate to most recent *full* month you have mint transactions for.
4. Cover your spending from previous month to reset your budget fresh next month
   * For each category with a negative (red) balance. Click the "Balance" value field. A dropdown will open.
   * Choose "Cover Overspending" from the dropdown and select "To Be Budgeted" to rebalance the category.
   * You can can also choose to "Remove Overspending Rollover" at this pint from the Balance dropdown if you don't want it for this category going forward.
5. Navigate to the current month, and now you can set up your new budget accurately going forward.
