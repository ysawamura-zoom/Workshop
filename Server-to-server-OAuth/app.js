/////////////////////////////////////////////////////////////////////////////////////////////////
// Oct 12, 2022
// yosuke.sawamura@zoom.us
// API demo using Server to Server OAuth to get access_token and exec an API request
//
// Note)
// access_token will be stored in to a file along with the expire time.
// lock file will be generated during the writing process.
// access_token will be geratee again if the saved access_token is expired.
// 
// Run
// $ npm install request jwt-decode fs
// $ node app.js
//
/////////////////////////////////////////////////////////////////////////////////////////////////

// NODE MODULES
const request = require('request')
const jwt_decode = require('jwt-decode')
const fs = require('fs')
const fsPromises = require('fs/promises')

// VARIABLES
const ZOOM_API_ACCOUNTID = "ACCOUNT ID FROM ZOOM MARKETPLACE"
const ZOOM_API_CLIENTID = "CLIENT ID FROM ZOOM MARKETPLACE"
const ZOOM_API_CLIENTSECRET = "CLIENT SECRET FROM ZOOM MARKETPLACE"
const basenc = Buffer.from(ZOOM_API_CLIENTID + ":" + ZOOM_API_CLIENTSECRET).toString('base64');
const datafile = "./token_data.dat"
const lockfile = "./lockfile.lock"

// GET API TOKEN (Server to Server OAUTH)
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
             const obj = JSON.parse(body);
             const data = obj.access_token;
             resolve(data);
         }
     })
   })
}

// SEND REQUEST
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
            resolve(body);
          }
      })
    })
}

// READ FROM DATA FILE
async function readdata(){
    try {
      const data = await fsPromises.readFile(datafile, 'utf-8')
      //console.log("1: " + data)
      return data
    } catch (err) {
      console.error(err)
      return false
    }
}

// WRITE TO DATA FILE
async function writedata(newdata){
  try {

    // CREATE LOCK FILE BEFORE WRITING
    await fsPromises.open(lockfile,'w')
     .then((result)=>{
      console.log("lockfile created");
    })
     .catch((error)=>{
     console.log(error);
    });

    // CREATE LOCK FILE BEFORE WRITING
    await fsPromises.writeFile(datafile, newdata)
    console.log('new access_token is saved successfully.')

    // REMOVE LOCK FILE AFTER WRITING
    await fsPromises.unlink(lockfile)
     .then((result)=>{
      console.log("lockfile deleted");
    })
     .catch((error)=>{
     console.log(error);
    });

  } catch (err) {
    console.error(err)
  }
}

// CHECK IF FILE EXISTS
async function checkfile(path){
  let b
  await fsPromises.access(path, fs.constants.F_OK)
  .then(() => {
    b = true
  })
  .catch(() => {
    b = false
  });
  return b
}

// SLEEP FUNCTION
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


// MAIN FUNCTION
async function run(){

  // CHECK DAT FILE EXITS, CREATE IF NOT
  let isDatafile = await checkfile(datafile)
  console.log("isDatafile " + datafile + " : " + isDatafile)

  if(!isDatafile){
      let newdata = '{"access_token":"","exp":0}'
      await fsPromises.writeFile(datafile, newdata)
  }

  // CHECK IF LOCK FILE EXITS, WAIT IN LOOP TILL LOCKFILE IS GONE
  let isLockfile = await checkfile(lockfile)
  console.log("isLockfile " + lockfile + " : " + isLockfile)

  if(isLockfile){
    let len = 5
    let i
    for (i = 0; i < len; i++) {
      await sleep(1000)
      console.log("waiting for the lockfile to be unlocked");
      let locked = await checkfile(lockfile)
      if(!locked){
        break
      }
    }
    if(i == len){
      console.log("lockfile was not removed within " + len + " sec")
      return
    }
  }

  // READ DAT FILE AND EXTRACT IN TO VALUES
  let d = await readdata()
  let obj = JSON.parse(d)
  let access_token = obj.access_token
  let exp = obj.exp;

  //console.log("access_token: " + access_token)
  //console.log("exp: " + exp)

  // CHECK CURRENT TIME IN SEC AND COMPARE WITH EXISTING EXP
  let now = Math.round(new Date() / 1000)
  //console.log("now: " + now)

  if(exp < now){
    console.log("token is expired")
    access_token = await getToken(ZOOM_API_ACCOUNTID,basenc);
    //console.log("access_token: " + access_token)
    const decoded = jwt_decode(access_token);
    exp = decoded.exp;
    //console.log("exp: " + exp)

    let tokendata = '{"access_token":"' + access_token + '", "exp":' + exp + '}'
    await writedata(tokendata)
  }else{
    console.log("token is still valid")
    //console.log(access_token)
  }
  // EXECUTE API REQUEST
  let requestapi = "/users"
  let requestbody = JSON.parse('{}')
  let method = "GET"
  let res = await apiRequest(access_token, requestapi, requestbody, method)
  console.log(res)
}

// RUN MAIN FUNCTION
run()
