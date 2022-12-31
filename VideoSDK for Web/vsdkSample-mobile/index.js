/*
Zoom Video SDK Sample
yosuke.sawamura@zoom.us
12/29/2022
*/
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
const KJUR = require('jsrsasign')

const app = express()
const port = 4106
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

app.use(function(req, res, next) {
  //res.header("Cross-Origin-Embedder-Policy", "require-corp")
  //res.header("Cross-Origin-Opener-Policy", "same-origin")
  res.header("Cross-Origin-Embedder-Policy", false)
  res.header("Cross-Origin-Opener-Policy", false)
  next()
})
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json(), cors())

app.post('/', (req, res) => {

  const iat = Math.floor(new Date().getTime() / 1000)
  const exp = iat + 60 * 60 * 2

  const oHeader = { alg: 'HS256', typ: 'JWT' }

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
