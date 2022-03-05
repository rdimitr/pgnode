const { response } = require('express')
const express = require('express')
const app = express()
app.use(express.json())
const port = 3001

const dbpg = require('./dbpg')



app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
  next();
});

app.get('/viewdict', (req, res) => {
  dbpg.getAllCurr()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  });
})


app.get('/viewdict/:idcurr', (req, res) => {
  dbpg.getOneCurr(req.params.idcurr)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  });
})

app.get('/viewrates', (req, res) => {
  dbpg.getRates()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  });
})

app.get('/getnewdata', (req,res) => {
  dbpg.getNewData();
  res.status(200).send('Data updated');
})

app.get('/getbanks', (req,res) => {
  dbpg.getBanks(res);
})

app.post('/addbank', (req,res) => {
  dbpg.addBank(res);
})


app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})