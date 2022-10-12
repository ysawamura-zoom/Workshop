/////////////////////////////////////////////////////////////////
// Sep 16, 2022
// yosuke.sawamura@zoom.us
// OAuth Sample using node User-Managed OAuth
/////////////////////////////////////////////////////////////////
const express = require('express');
const path = require('path');
const request = require('request');
const jwt_decode = require('jwt-decode');
const ejs = require("ejs");
const fs = require('fs');
const url = require('url');

const app = express();
const port = 4501;

const redirect_uri = "https://<YOUR SERVER>";       // URL of your server
const clientID = "<YOUR OAUTH CLIENT ID";           // Copy Clent ID from Markteplace Oauth app
const clientSecret = "<YOUR OAUTH CLIENT SECRET>";  // Copy Client Secret from Markteplace Oauth app
let data = clientID + ":" + clientSecret;
let buff = Buffer.from(data);
const authorization = buff.toString('base64');            // Generate Base64-encoded token from clientID and clientSecret

app.get('/', async (req, res) => {
    console.log("Received GET request");
    var htmlbody;
    if(req.query.code){
      console.log("code: " + req.query.code);
      const requestbody = "code=" + req.query.code + "&grant_type=authorization_code&redirect_uri=" + redirect_uri;

      results = await accesstokenRequest(authorization,requestbody);
      results = JSON.parse(results);  // Results will be in string so parse it
      const access_token = results.access_token;    //  Access tokens expire after one hour
      const refresh_token = results.refresh_token;  //  Refresh tokens expire after 15 years.
      const decoded = jwt_decode(access_token);
      const exp = decoded.exp;

      results = await apiRequest("users/me", "GET", access_token, "");
      const email = results.email;    // Most API replies in json format but be aware for any format when an error occurs.

      WriteToLog("user email: " + email);
      WriteToLog("access_token: " + access_token);
      WriteToLog("refresh_token: " + refresh_token);
      WriteToLog("exp: " + exp);

      htmlbody = '<html><body>' +
                    '<h1>Success</h1>' +
                    '<p>User Email: ' + email + '</p>' +
                    '<p>access_token: ' + access_token + '</p>' +
                    '<p>refresh_token: ' + refresh_token + '</p>' +
                    '<p>exp: ' + exp + '</p>' +
                '</body></html>';
    }else{
      console.log("no code");
      htmlbody = '<html><body>' +
                    '<h1>Error - node code</h1>' +
                '</body></html>';
    }
    res.status(200);
    res.send(htmlbody);
    res.end();
});

app.post('/', (req, res) => {
    console.log(req.body);
    res.status(200);
    res.end();
});

app.listen(port, () => console.log(`Zoom OAuth user-managed. port: ${port}!`));

// Request for users access_token once code is redirected, this can be used for refrshed token as well
// NEW requestbody : code=[CODE]&grant_type=authorization_code&redirect_uri=[REDIRECT URI]&code_verifier=[CODE VERIFIER]
// REFRESH requestbody: refresh_token=[REFRESH TOKEN]&grant_type=refresh_token
async function accesstokenRequest(token, requestbody){
  return new Promise(function (resolve, reject) {
    request({
          url: "https://zoom.us/oauth/token?" + requestbody,
          method: "POST",
          headers: {
              'Authorization': 'Basic ' + token,
              'Content-Type': 'application/x-www-form-urlencoded'
          }
      }, async function(error, response, body) {
          if (error) {
              console.log("error: " + error);
              reject(error)
          } else {
              console.log("Requesting for access token");
              //console.log(body);
              resolve(body);
          }
      });
    });
};

// Api request once access_token is retrieved
async function apiRequest(api,method,token,requestbody){
  return new Promise(function (resolve, reject) {
    request({
          url: "https://api.zoom.us/v2/" + api,
          method: method,
          headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
          },
          json: true,
          body: requestbody
      }, async function(error, response, body) {
          if (error) {
              console.log("error: " + error);
              reject(error)
          } else {
              //console.log(body);
              console.log("Making an api request on behalf of user");
              resolve(body);
              // If access_token was expired,
              // {
              //    "code": 124,
              //    "message": "Access token is expired."
              // }
              //
          }
      });
    });
};


//WRITE TO FILE
function WriteToLog(val) {
  const v = LogDateTime() + " " + val + "\n";
  console.log(v);
  fs.appendFile(path.join(__dirname, './oauth.log'), v, err => {
    if (err) {
      console.error(err)
      return
    }
  })
};

//GET CURRENT TIME
function LogDateTime(){
  var dt = new Date();
  var d = dt.getFullYear() + '-' +
    ("0" + (dt.getMonth() + 1)).slice(-2) + '-' +
    ("0" + (dt.getDate())).slice(-2) + ' ' +
    ("0" + dt.getHours()).slice(-2) + ':' +
    ("0" + dt.getMinutes()).slice(-2) + ':' +
    ("0" + dt.getSeconds()).slice(-2);
  return d
};
