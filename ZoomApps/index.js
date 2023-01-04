////////////////////////////////////////////////////////////////////////
//
// ZoomApps Sample
// yosuke.sawamura@zoom.us
//
// See below to set up Zoom Client to debug webview
// https://marketplace.zoom.us/docs/zoom-apps/create-zoom-app/
//
// To enable guest mode, use below on Mac terminal
// defaults write ZoomChat enableGuestModeTesting true
// * https://marketplace.zoom.us/docs/zoom-apps/guides/guest-mode/
//
////////////////////////////////////////////////////////////////////////

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const crypto = require("crypto")
const app = express()
const port = 4601
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

app.use(function(req, res, next) {
  //console.log(JSON.stringify(req.headers))
  //CHECK Headers to defind who is accessing
  var zoomAppContext = req.headers["x-zoom-app-context"];
  if(zoomAppContext){
    console.log("zoomAppContext: " + zoomAppContext);
    var dec = decrypt(zoomAppContext, process.env.ZoomAppsOAuthClientSecret)
    console.log("dec: " + JSON.stringify(dec))
    var uid = dec["uid"]
    console.log("uid: " + uid)
  }
  //OWASP Headers Required for ZoomApps
  res.header('Strict-Transport-Security', 'max-age=63072000')
  res.header('X-Content-Type-Options', 'nosniff')
  res.header(
    'Content-Security-Policy',
    "default-src *; \
    img-src * data:; \
    media-src *; \
    connect-src *; \
    script-src 'self' 'unsafe-inline' *; \
    style-src 'self' 'unsafe-inline' *;"
  )
  res.header('Referrer-Policy', 'same-origin')
  next()
})

app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json(), cors())

app.get('/oauth', (req, res) => {
  if(req.query.code){
    console.log("code: " + req.query.code);
    // DO YOUR OAUTH LOGIC HERE
    // "uid" USED INSIDE ZOOM APPS IS THE SAME "id" RETRIVED BY USER INFO OVER API
    // https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/user
  }
  var htmlbody = '<html><body>' +
                '<h1>OAuth</h1>' +
                '<p>code: ' + req.query.code + '</p>' +
                '</body></html>'
  res.status(200)
  res.send(htmlbody)
  res.end()
})

app.listen(port, () => console.log(`ZoomApps Sample. port: ${port}!`))

// X-Zoom-App-Context context Decryption
function unpack(context) {
  // Decode base64
  let buf = Buffer.from(context, "base64")
  // Get iv length (1 byte)
  const ivLength = buf.readUInt8()
  buf = buf.slice(1)
  // Get iv
  const iv = buf.slice(0, ivLength)
  buf = buf.slice(ivLength)
  // Get aad length (2 bytes)
  const aadLength = buf.readUInt16LE()
  buf = buf.slice(2)
  // Get aad
  const aad = buf.slice(0, aadLength)
  buf = buf.slice(aadLength)
  // Get cipher length (4 bytes)
  const cipherLength = buf.readInt32LE()
  buf = buf.slice(4)
  // Get cipherText
  const cipherText = buf.slice(0, cipherLength)
  // Get tag
  const tag = buf.slice(cipherLength)
  return {
    iv,
    aad,
    cipherText,
    tag,
  }
}

function decrypt(context, secret) {
  const { iv, aad, cipherText, tag } = unpack(context)
  const decipher = crypto
    .createDecipheriv(
      "aes-256-gcm",
      crypto.createHash("sha256").update(secret).digest(),
      iv
    )
    .setAAD(aad)
    .setAuthTag(tag)
    .setAutoPadding(false);
  const decrypted = decipher.update(cipherText) + decipher.final()
  return JSON.parse(decrypted)
}
