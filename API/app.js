/////////////////////////////////////////////////////////////////
// Oct 12, 2022
// yosuke.sawamura@zoom.us
// API demo using Server to Server OAuth access_token
//
// Run
// $ npm install request jwt-decode
// $ node getUser.js
//
/////////////////////////////////////////////////////////////////


//NODE MODULES
const request = require('request')
const jwt_decode = require('jwt-decode');

//VARIABLES
const ZOOM_API_ACCOUNTID = "GnEBo30iQZaO3QPlNeHadA"
const ZOOM_API_CLIENTID = "IgiOV9D6R6W6Wxs33Et9lQ"
const ZOOM_API_CLIENTSECRET = "wGK46B3ktgTtysPrcL7WRdwUlgHwK3I4"
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

//SEND REQUEST
/*
async function apiRequest(token, requestapi, requestbody, method){

  return new Promise(function (resolve, reject) {
    request({
          url: "https://api.zoom.us/v2/" + requestapi,
          method: method,
          headers: {
              'Authorization': 'Bearer ' + token,
              'Content-type': 'application/json'
          },
          json: true,
          body: requestbody
      }, async function(error, response, body) {
          if (error) {
              console.log(error);
              reject(error)
          } else {
            //var obj = JSON.parse(body);
            resolve(body);
          }
      })
    })
}
*/


//FUNCTION
async function run(){
  let token = await getToken(ZOOM_API_ACCOUNTID,basenc);
  console.log("access_token: " + token)
  const decoded = jwt_decode(token);
  const exp = decoded.exp;
  console.log("exp: " + exp)
  /*
  let requestapi = "/users/me"
  let requestbody = JSON.parse('{}');
  //requestbody["XXXXX"] = "YYYYY";
  let method = "GET"

  let res = await apiRequest(token, requestapi, requestbody, method);
  console.log(res)
  */
}



run();
