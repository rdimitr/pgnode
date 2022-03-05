const fetch = require('cross-fetch');
const { response } = require('express');
const { database } = require('pg/lib/defaults');

const Pool = require('pg').Pool;

const pool = new Pool({
  user: '*****',
  host: '192.168.15.3',
  database: 'mydb',
  password: '*****',
  port: 5432,
});

function getAllCurr() {
    return new Promise(function (resolve, reject) {
        let s = 'SELECT * FROM \"CURR\".\"CURR_LIST\"';
        pool.query(s, (error, results) => {
            if (error) {
                reject(error);
            }
            resolve(results.rows);
        });
    });
}

function getOneCurr(nameCurr) {
    return new Promise(function(resolve, reject){
        pool.query('SELECT * FROM \"CURR\".\"CURR_LIST\" WHERE \"IdCurrency\"=$1', [nameCurr], (error, results)=>{
            if(error){
                reject(error); 
            }
            resolve(results.rows)
        })
    })
}

function getRates() {
  return new Promise(function (resolve, reject) {
      let s = `SELECT \"IdCurrency\", \"CurrValue\", TO_CHAR(\"DateRequest\", \'DD.MM.YYYY\') as \"DtR\", \"DeltaAbs\", 
                      \"DeltaPrc\", TO_CHAR("PrevDateRequest\", \'DD.MM.YYYY\') as \"DtPR\" FROM \"CURR\".\"CURR_RATES\"`;
      pool.query(s, (error, results) => {
          if (error) {
              reject(error);
          }
          resolve(results.rows);
      });
  });
}


function getNewData(){
  fetch('https://www.cbr-xml-daily.ru/daily_json.js')
    .then((response) => response.json())
    .then(function(data) {
        for (key in data.Valute) {
          pool.query(`INSERT INTO \"CURR\".\"CURR_LIST\" (\"IdCurrency\", \"IdCB\", \"IdNumCode\", \"Name\") 
                    VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
                    [key, data.Valute[key]["ID"], data.Valute[key]["NumCode"],data.Valute[key]["Name"]], 
                    (er, rs)=>{
                         if(er){ console.log(er); }
                    })
        }
        return data;
      })
    .then((nextdata)=>{
        for (item in nextdata.Valute) {
          pool.query(`INSERT INTO \"CURR\".\"CURR_RATES\" (\"IdCurrency\", \"CurrValue\", \"PrevValue\", \"DateRequest\", \"PrevDateRequest\")
                    VALUES ($1, $2, $3, $4, $5)`, 
                    [ item, nextdata.Valute[item]["Value"], nextdata.Valute[item]["Previous"], nextdata.Date, nextdata.PreviousDate], 
                    (e, r)=>{
                      if (e){ console.log(e); }
                    })
        }
      })  
}


async function getBanks(res){
  let fdata = await fetch('https://g8a8a62f88cf8c8-mydboracle19c.adb.us-phoenix-1.oraclecloudapps.com/ords/dimitr/api/banks/viewbanks');
  let data = await fdata.json();

  data.items.forEach(obj => {
    Object.entries(obj).forEach(([key, value]) => {
        console.log(`${key} ${value}`);
    });
    console.log(`--------------`);
  });

  return res.status(200).send(data.items);
}

async function addBank(res) {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  };

  function arrayRandElement(arr) {
    var rand = Math.floor(Math.random() * arr.length);
    return arr[rand];
  }

  let bData = {NAMEBANK: '', COUNTRY: '', PRC: 0};
  var arr = ['RUS', 'USA', 'JPN', 'HGR', 'ITA', 'NOR', 'FRA'];

  bData.NAMEBANK = 'Тестовый банк номер ' + (getRandomInt(200, 10000)).toString();
  bData.COUNTRY = arrayRandElement(arr);
  bData.PRC = getRandomInt(1, 20) + Number(Math.random().toFixed(2));

  console.log(bData);

  let response = await fetch('https://g8a8a62f88cf8c8-mydboracle19c.adb.us-phoenix-1.oraclecloudapps.com/ords/dimitr/api/banks/addbank', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(bData)
  });

  console.log('Status: ', response.status, '  Message: ', response.statusText);
  
  return res.status(response.status).send(response.statusText);
}


module.exports = {
    getAllCurr,
    getOneCurr,
    getNewData,
    getRates,
    getBanks,
    addBank
  }
