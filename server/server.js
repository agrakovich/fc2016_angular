"use strict";

const express     = require('express');
const app         = express();
const bodyParser  = require('body-parser'); // стандартный модуль, для парсинга JSON в запросах
const methodOverride  = require('method-override');  // поддержка put и delete
const morgan      = require('morgan');
const mongoose    = require('mongoose');
const oauth2 = require('./oauth2');
const config = require('./config/config.json');
const authRoutes = require('./routes/authentification');
const articleRoutes = require('./routes/article');
const passport = require('passport');
const path = require('path');

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const webPackConfig = require('../webpack.config')

app.use(passport.initialize());
//require('./oauth')

mongoose.Promise = global.Promise;
mongoose.connect(config.database);

var compiler = webpack(webPackConfig);
app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: webPackConfig.output.publicPath }));
app.use(webpackHotMiddleware(compiler));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride()); // поддержка put и delete
app.use(morgan('dev'));

app.use('/auth', authRoutes);
app.post('/auth/token', oauth2.token);

app.use('/articles', articleRoutes);

app.set('port',  process.env.PORT || config.port);

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

//Kludge for react-router
app.get('/auth', function(req, res) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
})

app.use(express.static(path.join(__dirname, '..', 'src')));

app.use(function(req, res, next){
    res.status(404);
    console.log(`Not found URL: ${req.url}`);
    //res.sendFile(path.join(__dirname, '..', '404.html'));
    res.send({ error: 'Not found' });
    return;
});

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    console.log(`Internal error(${res.statusCode} : ${err.message})`);
    res.sendFile(path.join(__dirname, '..', '500.html'));
    return;
});

