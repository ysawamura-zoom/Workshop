require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const KJUR = require('jsrsasign')

const app = express()
const port = process.env.PORT || 4001
const path = require('path');

app.use(function(req, res, next) {
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json(), cors());

app.post('/', (req, res) => {

  const iat = Math.round(new Date().getTime() / 1000);
  const exp = iat + 60 * 60 * 2

  const oHeader = { alg: 'HS256', typ: 'JWT' }

  console.log(req.body.topic);
  console.log(req.body.role);
  console.log(req.body.password);

  const oPayload = {
    app_key: process.env.ZOOM_VSDK_KEY,
    tpc: req.body.topic,
    role_type: req.body.role,
    pwd: req.body.password,
    iat: iat,
    exp: exp,
  }

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_VSDK_SECRET)

  res.json({
    signature: signature
  })
})

app.listen(port, () => console.log(`Zoom Video SDK for Web Sample. port: ${port}!`))
