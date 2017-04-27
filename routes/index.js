'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db/index.js');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT * FROM tweets INNER JOIN users ON users.id = tweets.user_id', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var username = req.params.username;
    client.query('SELECT * FROM tweets INNER JOIN users ON users.id = tweets.user_id AND users.name = $1', [username], function(err,result) {
      if (err) return next(err);
      res.render('index', { title: 'Twitter.js', tweets: result.rows, showForm: true});
    });
    // tweetBank.find({ name: req.params.username });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsForName,
    //   showForm: true,
    //   username: req.params.username
    // });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var tweetID = req.params.id;
    client.query('SELECT * FROM tweets INNER JOIN users ON users.id = tweets.user_id WHERE tweets.id = $1', [tweetID], function(err, result) {
      if(err) return next(err);
      res.render('index', {title: 'Twitter.js', tweets: result.rows, showForm: false});
    });

    // tweetBank.find({ id: Number(req.params.id) });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsWithThatId // an array of only one element ;-)
    // });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    //user exists
    var tweetContent = req.body.content;
    var username = req.body.name;
    var userID = client.query('SELECT id FROM users WHERE name = $1',[username], function(err, result) {
      if(err) return next(err);
      return result;
    });
    var newTweet = client.query('INSERT INTO tweets (content, user_id) values ($1, $2)', [tweetContent, userID], function(err, result) {
      if(err) return next(err);
      res.redirect('/');
    });
    io.sockets.emit('new_tweet', newTweet);
    res.redirect('/');
    //user does not exist
    var newTweet = client.query('INSERT INTO tweets');
    io.sockets.emit('new_tweet', newTweet);
    res.redirect('/');
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
