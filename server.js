'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const mongooseConfig = require('./mongoose_myconfig.js');
const urlValidator = require('./urlchecker_regex.js');
const { Url } = require('./url_basicschema.js');
const crypto = require('crypto');
const cors = require('cors'); 
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cors());

app.set('view engine', 'pug');

mongoose.connect(process.env.MONGO_URI, mongooseConfig);

const db = mongoose.connection;

db.on('error', err => console.error(`connection error:${err}`));
 
db.once('open', () => console.log('db connection successful'));

//app.get('/', (req, res) => res.render('index'));
app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});
 

app.get('/api/shorturl/:shortcut', (req, res, next) => {
  const shortcut = req.params.shortcut;
  Url.findOne({ shortcut: shortcut }, (err, doc) => {
    if (err) next(err);
    if (!doc) return res.json({ error: 'Unknown shortcut' });
    res.redirect(doc.url);
  });
});

app.post('/api/shorturl/new', (req, res, next) => {
  const userGivenUrl = req.body.url.toLowerCase();
  const shortcut = crypto.randomBytes(7).toString('base64').replace(/\W/g, '0').slice(-9);
  console.log(shortcut);
  const shortUrl = new Url({ url: userGivenUrl, shortcut: shortcut });
  if (!userGivenUrl.match(urlValidator)) res.json({ error: 'Invalid URL' });
  Url.findOne({ url: userGivenUrl }, (err, doc) => { 
    if (err) next(err);
    if (doc) return res.status(201).json({url: doc.url, shortcut: doc.shortcut}); 
    shortUrl.save((err, doc) => { 
      if (err) next(err);
      res.status(201).json({url: doc.url, shortcut: doc.shortcut}); 
    });
  });
});

app.use((req, res, next) => { // catch 404 and forward to error handler
  const err = new Error('Not Found');
  err.status = 404;
  next(err); 
});

app.use((err, req, res, next) => { // Error Handler
  res.status(err.status || 500);
  res.json({ error: { message: err.message } });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});