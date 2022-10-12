/////////////////////////////////////////////////////////////////
// Oct 12, 2022
// yosuke.sawamura@zoom.us
// Webhook demo along with downloading cloud recorded files and sending chat message to chat channel.
// *require credentioals from Server to Server OAuth 
//
// Run
// $ npm install request
// $ node webhook.js
//
/////////////////////////////////////////////////////////////////


require('dotenv').config()
const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const request = require('request');
const app = express();
const port = process.env.PORT || 4002;

//HTTPS ON EXPRESS FRAMEWORK
const options = {
  key: fs.readFileSync('/etc/pki/tls/private/key.pem'),
  cert: fs.readFileSync('/etc/pki/tls/private/crt.pem'),
  ca: fs.readFileSync('/etc/pki/tls/private/chain.pem')
};
const server = https.createServer(options,app);

app.use(bodyParser.json());

app.get('/', (req, res) => {
  console.log("GET");
  res.status(200);
  res.send(`Zoom API Webhook example server successfully running.`);
})

app.post('/webhook', (req, res) => {
  console.log("POST");

  var response;

  console.log(req.headers);
  console.log(req.body);

  //VERIFY WEBHOOK EVENT SIGNATURE
  const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(message).digest('hex');
  const signature = `v0=${hashForVerify}`;

  if (req.headers['x-zm-signature'] === signature) {
    WriteToLog("SecretTokenVerification : true");
    if(req.body.event === 'endpoint.url_validation') {
      WriteToLog('endpoint.url_validation');
      /*const hashForValidate = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN).update(req.body.payload.plainToken).digest('hex');
      response = {
        message: {
          plainToken: req.body.payload.plainToken,
          encryptedToken: hashForValidate
        },
        status: 200
      };
      console.log(response.message);
      res.status(response.status);
      res.json(response.message);
      */
    }else{
      switch (req.body.event){
        case 'recording.completed':
          WriteToLog('recording.completed');
          let hostid = req.body.payload.object.host_id;
          let play_url = req.body.payload.object.recording_files[0].play_url;
          let download_url = req.body.payload.object.recording_files[0].download_url;
          let token = req.body.download_token;
          let url = download_url + "?access_token="+token;
          let filename = req.body.payload.object.recording_files[0].recording_start;
          let path = "./download/" + filename + ".mp4";
          /*
          console.log(download_url);
          console.log(token);
          console.log(url);
          console.log(filename);
          console.log(path);
          */
          SendChatMessage(hostid, play_url);
          Download(url, path);
          break;
        default:
          WriteToLog("Webhook notification received but no match");
      }
      response = { message: 'Zoom Webhook Demo Response', status: 200 };
      //console.log(response.message);
      res.status(response.status);
      res.json(response);
    }
  }else{
    WriteToLog("SecretTokenVerification : false");
    response = { message: 'Zoom Webhook Demo Response', status: 200 };
    res.status(response.status);
    res.json(response);
  }
});

//RUN HTTPS SERVER
server.listen(port, () => console.log(`Webhook Demo listening on port ${port}!`));

//WRITE TO FILE
function WriteToLog(val) {
  const v = DateTime() + " " + val + "\n";
  console.log(v);
  fs.appendFile('./webhook.log', v, err => {
    if (err) {
      console.error(err)
      return
    }
  })
};

//GET CURRENT TIME
function DateTime(){
  var dt = new Date();
  var d = dt.getFullYear() + '-' +
    ("0" + (dt.getMonth() + 1)).slice(-2) + '-' +
    ("0" + (dt.getDate())).slice(-2) + ' ' +
    ("0" + dt.getHours()).slice(-2) + ':' +
    ("0" + dt.getMinutes()).slice(-2) + ':' +
    ("0" + dt.getSeconds()).slice(-2);
  return d
};

//DOWNLOAD CLOUD RECORDED FILE
function Download(url, path){
  console.log("Download started");
  const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', callback)
    })
  }
  download(url, path, () => {
    WriteToLog("Download completed: " + path);
  })
};

//SEND A MESSAGE TOWARD A CHAT CHANNEL
async function SendChatMessage(hostid, play_url){
  let accountid = process.env.ZOOM_API_ACCOUNTID;
  let clientid = process.env.ZOOM_API_CLIENTID;
  let clientsecret = process.env.ZOOM_API_CLIENTSECRET;
  let basenc = Buffer.from(clientid + ":" + clientsecret).toString('base64');
  let token = await getToken(accountid,basenc);
  //console.log(token);

  let requestbody = JSON.parse('{}');
  requestbody["message"] = play_url;
  requestbody["to_channel"] = "<YOUR CHAT CHANNEL UUID>"; // CHAT CHANNEL UUID

  return new Promise(function (resolve, reject) {
    request({
          url: "https://api.zoom.us/v2/chat/users/" + hostid + "/messages",
          method: "POST",
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
            WriteToLog("SendChatMessage: " + body);
          }
      });
    });
};

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
     });
   });
};
