/////////////////////////////////////////////////////////////////
// Oct 12, 2022
// yosuke.sawamura@zoom.us
// Chat app demo
//
// Run
// $ npm install
// $ node index.js
//
/////////////////////////////////////////////////////////////////
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const crypto = require('crypto')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const app = express()
const port = 4302

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Welcome to Chatbot for Zoom!')
})

app.get('/authorize', (req, res) => {
  res.redirect('https://zoom.us/launch/chat?jid=robot_' + process.env.ZOOM_BOT_JID)
})

app.get('/support', (req, res) => {
  res.send('Visit My Support for help.')
})

app.get('/privacy', (req, res) => {
  res.send('Chatbot for Zoom privacy infomration to be noticed.')
})

app.get('/terms', (req, res) => {
  res.send('By installing Chatbot for Zoom, you are accept and agree to these terms...')
})

app.get('/documentation', (req, res) => {
  res.send('Chatbot sample on Zoom!')
})

app.post('/deauthorize', (req, res) => {
  if (req.headers.authorization === process.env.ZOOM_BOT_VERIFICATION_TOKEN) {
    res.status(200)
    res.send()
    request({
      url: 'https://api.zoom.us/oauth/data/compliance',
      method: 'POST',
      json: true,
      body: {
        'client_id': req.body.payload.client_id,
        'user_id': req.body.payload.user_id,
        'account_id': req.body.payload.account_id,
        'deauthorization_event_received': req.body.payload,
        'compliance_completed': true
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET).toString('base64'),
        'cache-control': 'no-cache'
      }
    }, (error, httpResponse, body) => {
      if (error) {
        console.log(error)
      } else {
        console.log(body)
      }
    })
  } else {
    res.status(401)
    res.send('Unauthorized request.')
  }
})

//RECIVEING CHATBOT WEBHOOK EVENTS
app.post('/<YOUR DEFINITION>', async function (req, res) {
  //console.log(req.headers);
  console.log(req.body)
  res.send('Message received')

  /*
  //VERIFICATION USING ZOOM_BOT_SECRET_TOKEN
  const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto.createHmac('sha256', process.env.ZOOM_BOT_SECRET_TOKEN).update(message).digest('hex');
  const signature = `v0=${hashForVerify}`;
  if (req.headers['x-zm-signature'] === signature) {
    console.log("SecretTokenVerification : true")
  }else{
    console.log("SecretTokenVerification : false")
  }
  */

  var chatbotToken = await getChatbotToken()
  //console.log(chatbotToken)

  var obj = {};
  switch(req.body.payload.cmd) {
    case "help":
      obj = {
        'head': {
          'text': 'Hi! Get started with the Chatbot example',
          "style": {
            "bold": true
          }
        },
        'body': [
          {
            'type': 'message',
            "style": {
              "bold": true
            },
            'text': 'help'
          },
          {
            'type': 'message',
            "style": {
              "bold": false
            },
            'text': 'will show this message'
          },
          {
            'type': 'message',
            "style": {
              "bold": true
            },
            'text': 'vote'
          },
          {
            'type': 'message',
            "style": {
              "bold": false
            },
            'text': 'will show example of some UI element customization'
          }
        ]
      }
      sendChat(chatbotToken,req.body.payload.toJid, req.body.payload.accountId, obj)
      break;
    case "vote":
      obj = {
        'header': { 'text': 'Vote bot' },
        'body': [
          {
            'type': 'section',
            'sections': [
                          {
                            'type': 'message',
                            //'text': '"' + event.message + '"'
                            'text': 'VOTE EXAMPLE'
                          },
                          {
                            'type': 'actions',
                            'items': [{
                              'text': 'Up Vote',
                              'value': 'up-vote',
                              'style': 'Primary'
                            },
                            {
                              'text': 'Down Vote',
                              'value': 'down-vote',
                              'style': 'Danger'
                            }]
                          }
                        ],
                        //'footer': 'Vote by User' + event.payload.userName
                        'footer': 'Vote by ' + req.body.payload.userName
                      }
                    ]
              }
      sendChat(chatbotToken,req.body.payload.toJid, req.body.payload.accountId, obj)
      break;
    default:
    if(req.body.payload.actionItem){
      var t = req.body.payload.actionItem.text
      var v = req.body.payload.actionItem.value
      obj = {
        'head': {
          'text': 'VOTE EXAMPLE - RESULT'
        },
        'body': [{
          'type': 'message',
          'text': 'You selected: ' + req.body.payload.actionItem.text
        }]
      }
    }else{
      obj = {
        'head': {
          'text': 'Message'
        },
        'body': [{
          'type': 'message',
          'text': 'You sent: ' + req.body.payload.cmd
        }]
      }
    }
    sendChat(chatbotToken,req.body.payload.toJid, req.body.payload.accountId, obj)
  }
})

app.listen(port, () => console.log(`Chatbot for Zoom listening on port ${port}!`))


//GET ACCESS_TOKEN TO SEND CHATBOT APIs
function getChatbotToken () {
  console.log("getChatbotToken")
  return new Promise(function (resolve, reject) {

  request({
    url: `https://zoom.us/oauth/token?grant_type=client_credentials`,
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET).toString('base64')
    }
  }, (error, httpResponse, body) => {
    if (error) {
      console.log('Error getting chatbot_token from Zoom.', error)
      reject(error)
    } else {
      body = JSON.parse(body)
      //console.log(body.access_token)
      resolve(body.access_token)
      //sendChat(body.access_token)
    }
  })

})
}

//SEND CHAT MESSAGES
function sendChat (chatbotToken, tojid, accountid, msgbody) {
  console.log("sendChat")
  request({
    url: 'https://api.zoom.us/v2/im/chat/messages',
    method: 'POST',
    json: true,
    body: {
      'robot_jid': process.env.ZOOM_BOT_JID,
      'to_jid': tojid,
      'account_id': accountid,
      /*'content': {
        'head': {
          'text': '<YOUR DEFINITION>'
        },
        'body': [{
          'type': 'message',
          'text': 'You sent ' + msg
        }]
      }
      */
      'content': msgbody
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + chatbotToken
    }
  }, (error, httpResponse, body) => {
    if (error) {
      console.log('Error sending chat.', error)
    } else {
      console.log(body)
    }
  })
}
