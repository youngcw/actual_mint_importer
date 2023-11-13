This importer will import CSV exports from Mint.com into Actual Budget.

Mint doesn't export any budget data so you will need to setup the budgets yourself.  One option is to use the Report Budget in Actual.  That is a more traditional budget style and more in line with Mint. The data will look much more clean in the budget, but I recommend the other budget style as I find it more useful.

If you elect to use the default Rollover Budget (my recommended one) your imported data will cause really messy balances for prior months.  As I see it your options to use this style are to (sorted by expected difficulty)
1. Use a report budget to store the old data and start fresh in a new file moving forward. I would do this because most people seldom look at their old data, and I find zero-based budgeting much more useful.  You can always open the file of the old data and run reports on that if you want.
2. Do your best to start from the current month and ignore old ones.  It may take some transaction trickery to do this.
3. Do what it takes to clean up the old months.  May be hard you have have years of data 

To run the script I had the folowing setup:

1. Setup Actual how you like. You need an instance of actual-server running for the importer to access.
2. Create a new budget file and leave it empty.  Don't encrypt the file yet, the script isn't setup to open those.
2. Clone this repo, and cd into it
3. Store csv file in this direcotory that you exported from Mint.com
4. run `npm install`.  (I tested with node18)
5. Edit all the variables at the top of the file to match your setup.  You will need to use the sync_id from your budget file.  That can be found in settings->Advanced Settings->IDs
6. run `node mint.js`

The importer does the following:
* All categories listed in the CSV export will be created under a category group "Mint"
