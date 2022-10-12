// Run
// $ npm install request
// $ node getUser.js

//NODE MODULES
const request = require('request')

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


//FUNCTION
async function getUser(){
  let token = await getToken(ZOOM_API_ACCOUNTID,basenc);
  console.log(token)

  let requestapi = "/users"
  let requestbody = JSON.parse('{}');
  //requestbody["message"] = play_url;
  //requestbody["to_channel"] = "61ed4f102da8477fab0d8a30f0f0f574";
  let method = "GET"

  let res = await apiRequest(token, requestapi, requestbody, method);
  console.log(res)
}



getUser();
