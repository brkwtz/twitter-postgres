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
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var tweetID = req.params.id;
    console.log(req.params);
    console.log(req.params.id);
    client.query('SELECT * FROM tweets INNER JOIN users ON users.id = tweets.user_id WHERE tweets.id = $1', [tweetID], function(err, result) {
      if(err) return next(err);
      res.render('index', {title: 'Twitter.js', tweets: result.rows, showForm: false});
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){

    client.query('SELECT * FROM users WHERE users.name = $1', [req.body.name], checkID);

    function checkID(err, result) {

      if(err) return next(err)
      if(!result.rows.length) {
        makeUser()
      } else {
        setTweet(null, result)
      }
    }

    function makeUser() {
      client.query('INSERT INTO users (name) values ($1) RETURNING *', [req.body.name], setTweet)
    }

    function allDone(err) {
      if (err) return next(err)
      res.redirect('/')
    }

    function setTweet(err, result) {
      var user_id = result.rows[0].id;
      client.query('INSERT INTO tweets (user_id, content) values ($1, $2)', [user_id, req.body.content], allDone);
    }
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}


