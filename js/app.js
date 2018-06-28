'use strict';

$(document).ready(function() {
    fetchAllCurrencies();
});

/*
|------------------------------------------
| SERVICE WORKER SECTION
|------------------------------------------
*/

    if ('serviceWorker' in navigator) {
        if (location.hostname === 'harlyon.github.io') {
            navigator.serviceWorker.register('sw.js', { scope: location.pathname }).then(function() {
                console.log('service worker registered');
            })
        } else {
            navigator.serviceWorker.register('sw.js').then(function() {
                console.log('service worker registered');
            })
        }
    }
    
// track sw state
function trackInstalling(worker) {
    worker.addEventListener('statechange', function() {
        if (worker.state == 'installed') {
            updateIsReady(worker);
        }
    });
}

// update app 
function updateIsReady(sw) {
    // console.log('a new SW is ready to take over !');
    sw.postMessage('message', { action: 'skipWaiting' });
    pushUpdateFound();

}

// push updates
function pushUpdateFound() {
    $(".notify").fadeIn();
    console.log('sw found some updates.. !');
}



/*
|------------------------------------------
| INDEXED DB SECTION
|------------------------------------------
*/
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB");
}

// open database 
function openDatabase() {
    // return db instances
    const DB_NAME = 'currencyConvert';
    const database = indexedDB.open(DB_NAME, 1);

    // on error catch errors 
    database.onerror = (event) => {
        console.log('error opening web database');
        return false;
    };

    // check db version
    database.onupgradeneeded = function(event) {
        // listen for the event response
        var upgradeDB = event.target.result;

        // create an objectStore for this database
        var objectStore = upgradeDB.createObjectStore("currencies");
    };

    // return db instance
    return database;
}

// save to currencies object
function saveToDatabase(data) {
    // init database
    const db = openDatabase();

    // on success add user
    db.onsuccess = (event) => {

        // console.log('database has been openned !');
        const query = event.target.result;

        // check if already exist symbol
        const currency = query.transaction("currencies").objectStore("currencies").get(data.symbol);

        // wait for users to arrive
        currency.onsuccess = (event) => {
            const dbData = event.target.result;
            const store = query.transaction("currencies", "readwrite").objectStore("currencies");

            if (!dbData) {
                // save data into currency object
                store.add(data, data.symbol);
            } else {
                // update data existing currency object
                store.put(data, data.symbol);
            };
        }
    }
}

// fetch from web database
function fetchFromDatabase(symbol) {
    // init database
    const db = openDatabase();

    // on success add user
    db.onsuccess = (event) => {

        // console.log('database has been openned !');
        const query = event.target.result;

        // check if already exist symbol
        const currencies = query.transaction("currencies").objectStore("currencies").get(symbol);

        // wait for users to arrive
        currencies.onsuccess = (event) => {
            const data = event.target.result;

            // return data
            return data;
        }
    }
}

/*
|------------------------------------------
| API SECTION
|------------------------------------------
*/
// fetch all currencies 
const fetchAllCurrencies = (e) => {
    // used es6 Arrow func here..
    $.get('https://free.currencyconverterapi.com/api/v5/currencies', (data) => {
        // if data not fetch
        if (!data) console.log("Could not fetch any data");

        // convert pairs to array
        const pairs = objectToArray(data.results);

        // used for of loop
        for (let val of pairs) {
            // using template leteral
            $("#from-currency").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
            $("#to-currency").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
        }
    });
}

// convert currencies 
function convertCurrency() {
    let from = $("#from-currency").val();
    let to = $("#to-currency").val();
    let amount = $("#convert-amount").val();

    // restrict user for converting same currency
    if (from == to) {
        // console.log('error ');
        $(".error_msg").html(`
			<div class="card-feel">
				<span class="text-danger">
					Ops!, you can't convert the same currency
				</span>
			</div>
		`);

        // hide error message
        setTimeout((e) => {
            $(".error_msg").html("");
        }, 1000 * 3);

        // stop proccess
        return false;
    }

    // build query 
    let body = `${from}_${to}`;
    let query = {
        q: body
    };

    // convert currencies
    $.get('https://free.currencyconverterapi.com/api/v5/convert', query, (data) => {
            // convert to array
            const pairs = objectToArray(data.results);

            // iterate pairs
            $.each(pairs, function(index, val) {
                $(".results").append(`
				<div class="card-feel container text-center">
                    <h1 class="small text-center"> <b>${amount}</b>  <b>${val.fr}</b> to <b>${val.to}</b> converted successfully !</h1>
					<hr />
					Exchange rate for <b>${amount}</b> <b>${val.fr}</b> to <b>${val.to}</b> is: <br /> 
					<b>${numeral(amount * val.val).format('0.000')}</b>
				</div>
			`);

                // save object results for later use
                let object = {
                    symbol: body,
                    value: val.val
                };

                // save to database
                saveToDatabase(object);
            });

        }).fail((err) => {
                //check currencies from indexedDB
        const dbData = fetchFromDatabase(body);

        console.log(dbData);

        // console.log(dbData);
        // $(".results").append(`
        // 	<div class="card-feel">
        //               <h1 class="small text-center"> <b>${dbData.fr}</b> & <b>${dbData.to}</b> converted successfully !</h1>
        // 		<hr />
        // 		Exchange rate from <b>${dbData.fr}</b> to <b>${dbData.to}</b> is: <br /> 
        // 		<b>${amount * dbData.val}</b>
        // 	</div>
        // `);
    });

    // void form
    return false;
}

// array generators using map & arrow func
function objectToArray(objects) {
    // body...
    const results = Object.keys(objects).map(i => objects[i]);
    return results;
}

// refresh page
function refreshPage() {

    // body...
    window.location.reload();
}