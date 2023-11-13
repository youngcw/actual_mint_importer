To run this I had the folowwing setup:

1. Setup Actual how you like. You need an instance of actual-server running for the importer to access.
2. Create a new budget file, and leave it empty.  Don't encrypt the file yet, the script isn't setup to open those.
2. Clone this repo, and cd into it
3. Store csv file in this direcotory that you exported from Mint.com
4. run `npm install`.  (I tested with node18)
5. Edit all the variables at the top of the file to match your setup.  You will need to use the sync_id from your budget file.  That can be found in settings->Advanced Settings->IDs
6. run `node mint.js`
