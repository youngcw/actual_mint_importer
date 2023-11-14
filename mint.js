//////////////////////////////////////////////////////////
// Change these to match your setup
//////////////////////////////////////////////////////////
let url = "http://localhost:5006"; //url of your server that the script can use to access your budget files
let password = "your_password"; //passowrd of your server
let sync_id = ''; //should look something like 'ace017dc-ee96-4b24-a1f4-e6db10c96e53'
let inFile = "mint_test.csv" //path to file
let cache = "./cache"; // this is where the budget file will be stored during the import.  You can delete after
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

let api = require('@actual-app/api');
const csvToJson = require('csv-parse/sync');
const fs = require('fs');

const json = csvToJson.parse(fs.readFileSync(inFile, 'utf8'), {
  bom: true,
  quote: '"',
  trim: true,
  relax_column_count: true,
  skip_empty_lines: true,
  columns: header => {
    return header.map(column => column.replace(/\s+/g, ''));
  }
});

async function init() {
  console.log("connect");
  await api.init({
    // This is the URL of your running server
    serverURL: url,
    // This is the password you use to log into the server
    password: password,
    // Budget data will be cached locally here, in subdirectories for each file.
    dataDir: cache,
  });

}
(async () => {
  //let payees = [];
  let account = [];
  let category = [];
  //find all the needed info before importing
  for (let i=0;i<json.length;i++){
    //console.log(json[i]);
    //payees.push(json[i].Description);
    account.push(json[i].AccountName);
    category.push(json[i].Category);
  }
  //remove duplicates
  account = [...new Set(account)];
  //payees = [...new Set(payees)];
  category = [...new Set(category)];
  console.log(account);
  console.log(category);

  // This is the ID from Settings → Show advanced settings → Sync ID
  console.log("open file");
  await init();
  await api.downloadBudget(sync_id);
  console.log("add accounts");
  let account_ids = new Map();
  for (i=0;i<account.length;i++){
    account_ids.set(account[i], await api.createAccount({name: account[i], type: "checking"},0));
  }
  console.log("add Categories");
  let group_id = await api.createCategoryGroup({name: "Mint Import"});
  category_ids = new Map();
  for (i=0;i<category.length;i++){
    category_ids.set(category[i], await api.createCategory({name: category[i], group_id: group_id}));
  }
  console.log("importing transactions");
  for (i=0; i<json.length;i++){
    let trans = json[i];
    let flip = json[i].TransactionType==="debit" ? true : false;
    let amount = api.utils.amountToInteger(
      flip ? trans.Amount*-1 : trans.Amount
    );
    let date = new Date(trans.Date);
    let dateString = date.toISOString().split('T')[0]
    console.log(trans);
    accId = account_ids.get(trans.AccountName);
    try {
      await api.importTransactions(accId,[{
        date: dateString,// I think it needs to be in 'yyyy-mm-dd' format
        amount: amount,
        payee_name: trans.Description,
        imported_payee: trans.OriginalDescription,
        category: category_ids.get(trans.Category),
        notes: trans.Note,
        cleared: true,
      }]);
    } catch(e) {
      console.error(e)
    }
  }
  console.log("done");
  await api.shutdown();
})();
