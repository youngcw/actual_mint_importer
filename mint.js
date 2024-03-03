//////////////////////////////////////////////////////////
// Change these to match your setup
//////////////////////////////////////////////////////////
let url = process.env.ACTUAL_SERVER_URL || "http://localhost:5006" //url of your server that the script can use to access your budget files
let password = process.env.ACTUAL_SERVER_PASSWORD || "" //password of your server
let sync_id = process.env.ACTUAL_SYNC_ID || "" // found in advanced settings in  actualbudget, looks something like 'ace017dc-ee96-4b24-a1f4-e6db10c96e53'
let inFile = process.env.IMPORTER_INFILE || "transactions.csv" //path to file
let cache = process.env.IMPORTER_CACHE_DIR || "./cache" // this is where the budget file will be stored during the import.  You can delete after
// categories to consider as income to budget. Add any income categories from your mint budget here
let incomeCategories = process.env.IMPORTER_INCOME_CATEGORIES?.split(",").map(
  (cat) => cat.trim()
) || [
  "Paycheck",
  "Investment",
  "Returned Purchase",
  "Bonus",
  "Interest Income",
  "Reimbursement",
  "Rental Income",
]
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

let api = require("@actual-app/api")
const csvToJson = require("csv-parse/sync")
const fs = require("fs")

if (process.env.IMPORTER_EXTRA_INCOME_CATEGORIES) {
  incomeCategories = [
    ...incomeCategories,
    ...process.env.IMPORTER_EXTRA_INCOME_CATEGORIES.split(",").map((cat) =>
      cat.trim()
    ),
  ]
}

if (!password || !sync_id) {
  console.error("Required settings not provided.")
  process.exit(1)
}

const json = csvToJson.parse(fs.readFileSync(inFile, "utf8"), {
  bom: true,
  quote: '"',
  trim: true,
  relax_column_count: true,
  skip_empty_lines: true,
  columns: (header) => {
    return header.map((column) => column.replace(/\s+/g, ""))
  },
})

function wait(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

async function importTransactions(account, actualTrans) {
  try {
    await api.importTransactions(account, actualTrans)
    // Wait for the scheduledFullSync to start before we run any other operations
    await wait(2000)
  } catch (e) {
    console.error(e)
  }
}

async function init() {
  console.log("connect")
  await api.init({
    // This is the URL of your running server
    serverURL: url,
    // This is the password you use to log into the server
    password: password,
    // Budget data will be cached locally here, in subdirectories for each file.
    dataDir: cache,
  })
}
(async () => {
  //let payees = []
  let account = []
  let category = []
  //find all the needed info before importing
  for (let i = 0; i < json.length; i++) {
    //console.log(json[i])
    //payees.push(json[i].Description)
    account.push(json[i].AccountName)
    category.push(json[i].Category)
  }
  //remove duplicates
  account = [...new Set(account)]
  //payees = [...new Set(payees)]
  category = [...new Set(category)]
  console.log(account)
  console.log(category)

  // This is the ID from Settings → Show advanced settings → Sync ID
  console.log("open file")
  await init()
  await api.downloadBudget(sync_id)
  console.log("add accounts")
  let account_ids = new Map()
  for (i = 0; i < account.length; i++) {
    account_ids.set(
      account[i],
      await api.createAccount({ name: account[i], type: "checking" }, 0)
    )
    console.log(account[i], account_ids.get(account[i]))
  }
  try {
    await api.shutdown()
    await init()
    await api.downloadBudget(sync_id)
  } catch (error) {
    console.log(error)
  }


  console.log("add Categories:")
  let group_id = await api.createCategoryGroup({ name: "Mint Import" })
  console.log(group_id)
  let initial_categories = await api.getCategories()
  let income_group_id = initial_categories.find(
    (cat) => cat.name === "Income"
  ).group_id
  category_ids = new Map()
  for (i = 0; i < category.length; i++) {
    console.log("creating", category[i])
    category_ids.set(
      category[i],
      await api.createCategory({
        name: category[i],
        group_id: incomeCategories.includes(category[i])
          ? income_group_id
          : group_id,
      })
    )
    console.log(category[i], category_ids.get(category[i]))
  }
  console.log("categories created")
  try {
    await api.shutdown()
    await init()
    await api.downloadBudget(sync_id)
  } catch (error) {
    console.log(error)
  }

  let t = 0

  for (let j = 0; j < account.length; j++) {
    const accTransData = json.filter(
      (trans) => trans.AccountName === account[j]
    );
    console.log(`importing transactions for: "${account[j]}"`)
    const actualTrans = []
    for (const trans of accTransData) {
      let flip = trans.TransactionType === "debit" ? true : false
      let amount = api.utils.amountToInteger(
        flip ? trans.Amount * -1 : trans.Amount
      )
      let date = new Date(trans.Date)
      let dateString = date.toISOString().split("T")[0]
      console.log(++t)
      actualTrans.push({
        date: dateString, // I think it needs to be in 'yyyy-mm-dd' format
        amount: amount,
        payee_name: trans.Description,
        imported_payee: trans.OriginalDescription,
        category: category_ids.get(trans.Category),
        notes: trans.Note,
        cleared: true,
      })
      if (actualTrans.length == 1000) { // init, api.downloadBudget, run import stuff, api.shutdown
        try {
          await api.shutdown()
          await init()
          await api.downloadBudget(sync_id)
        } catch (error) {
          console.log(error)
        }

        await importTransactions(account_ids.get(account[j]), actualTrans)
        actualTrans.length = 0
      }
    }
    if (actualTrans.length > 0) { // init, api.downloadBudget, run import stuff, api.shutdown
      try {
        await api.shutdown()
        await init()
        await api.downloadBudget(sync_id)
      } catch (error) {
        console.log(error)
      }

      await importTransactions(account_ids.get(account[j]), actualTrans)
    }
  }
  console.log("done")
  await api.shutdown()
})()
