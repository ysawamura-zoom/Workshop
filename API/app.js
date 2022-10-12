/////////////////////////////////////////////////////////////////
// Oct 12, 2022
// yosuke.sawamura@zoom.us
// API demo using Server to Server OAuth access_token
//
// Run
// $ npm install request jwt-decode
// $ node app.js
//
/////////////////////////////////////////////////////////////////


//NODE MODULES
const request = require('request')
const jwt_decode = require('jwt-decode');

//VARIABLES
const ZOOM_API_ACCOUNTID = "<YOUR ACCOUNT ID>"
const ZOOM_API_CLIENTID = "<YOUR SERVER TO SERVER OAUTH CLIENT ID>"
const ZOOM_API_CLIENTSECRET = "<YOUR SERVER TO SERVER OAUTH CLIENT SECRET>"
const basenc = Buffer.from(ZOOM_API_CLIENTID + ":" + ZOOM_API_CLIENTSECRET).toString('base64');

//GET API TOKEN (Server to Server OAUTH)
async function getToken(accountid,basenc){
 return new Promise(function (resolve, reject) {
   request({
         url: "https://zoom.us/oauth/token?grant_type=account_credentials&account_id="+ accountid,
         method: "POST",
         headers: {
             'Authorization': 'Basic ' + basenc
         }
     }, async function(error, response, body) {
         if (error) {
             console.log(error);
             reject(error)
         } else {
             var obj = JSON.parse(body);
             const data = obj.access_token;
             resolve(data);
         }
     })
   })
}


//FUNCTION
async function run(){
  let token = await getToken(ZOOM_API_ACCOUNTID,basenc);
  console.log("access_token: " + token)
  const decoded = jwt_decode(token);
  const exp = decoded.exp;
  console.log("exp: " + exp)
}


run();
