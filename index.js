"use strict"

const https = require('https');
const url = require('url');
const config = require('./config/config.json');

function sendSlack(message, context) {
  const api_url = config.slack_hook_url;
  const options = url.parse(api_url);
  options.method = 'POST';
  options.headers = {'Content-Type': 'application/json'};

  https.request(options, (res) => {
    if (res.statusCode === 200) {
      context.succeed('posted to slack');
    } else {
      context.fail('status code: ' + res.statusCode);
    }
  }).on('error', function(e) {
    context.fail(e.message);
  });
  req.write(JSON.stringify({"text": message, "link_names": 1}));
  req.end();
}

function fetchUsers(callback) {
  const api_url = 'https://api.github.com/teams/' + config.github.team_id + '/members?access_token=' + config.github.access_token;
  const options = url.parse(api_url);
  options.headers = { 'User-Agent': 'lottery-reviewer-lambda' };

  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      let body = '';
      let users = [];
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
          body += chunk;
      });

      res.on('end', (res) => {
          res = JSON.parse(body);
          res.map((a)=>{ users.push(a.login) });
          resolve(users);
      });
    }).on('error', (e) => {
      reject({ message: 'fail to fetch github users.' });
    });
  });

}

function message(event, users) {
  const req_user = event.pull_request.user.login;
  users = users.filter((v,i) => { return (v !== req_user) } )
  const user = shuffle(users).pop();
  return "@" + user + " さん、 @" + req_user + " のプルリクレビューをお願いしたいでござる。 " + event.pull_request.title + " " + event.pull_request.html_url;
}

function shuffle(arr) {
  var i, j, temp;
  arr = arr.slice();
  i = arr.length;
  if (i === 0) {
    return arr;
  }
  while (--i) {
    j = Math.floor(Math.random() * (i + 1));
    temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

exports.handler = (event, context) => {
  if ('opened' == event.body.action) {
    fetchUsers().then((users) => {
      const msg = message(event.body, users);
      sendSlack(msg, context);
    }, (error) => {
      context.fail(error);
    });
  }
};
