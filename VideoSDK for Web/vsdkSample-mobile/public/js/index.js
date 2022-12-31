/*
Zoom Video SDK Sample for Mobile Browser
yosuke.sawamura@zoom.us
12/31/2022
*/

let ZoomVideo
let client
let stream
let videoDecode
let videoEncode
let audioDecode
let audioEncode
let shareDecode
let shareEncode

////////////////////////////////////////////////////////////////////////
//LOAD EVENT LISTENER FOR BUTTONS

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('user_name').value = "User" + Math.floor(Math.random() * 100)
  document.getElementById('join-button').addEventListener('click', joinSession)
  document.getElementById('leave-button').addEventListener('click', leaveSession)
  document.getElementById('audio-start-button').addEventListener('click', audioStart)
  document.getElementById('audio-stop-button').addEventListener('click', audioStop)
  document.getElementById('mic-button').addEventListener('click', micMuteUnmute)
  document.getElementById('camera-button').addEventListener('click', cameraStartStop)
  document.getElementById('camera-switch-button').addEventListener('click', cameraSwitch)
  //document.getElementById('screenshare-button').addEventListener('click', screenShare)
  document.getElementById('qos-button').addEventListener('click', enableQOS)

  let agent = navigator.userAgent;

  switch(true){
    case agent.includes("iPhone") || agent.includes("iPad"):
     document.getElementById("self-video-element").style.display = "none"
    break
    case agent.includes("Android"):
     document.getElementById("self-canvas-element").style.display = "none"
    break
  }

  console.log('DOMContentLoaded')
})

////////////////////////////////////////////////////////////////////////
// TO BEGIN
// 1. CREATE VIDEO SDK CLIENT
// 2. INITIALIZE VIDEO SDK CLEINT
// 3. ADD LISTENER THEN JOIN

async function joinSession() {

  //CREATE VIDEO SDK CLIENT
  ZoomVideo = window.WebVideoSDK.default
  client = ZoomVideo.createClient()

  //INIT VSDK CLIENT
  client.init('en-US', 'CDN')

  //LISTEN FOR CONNECTION STATUS
  client.on('connection-change', (payload) => {
   console.log("Connection Change: ", payload)
   if(payload.state == "Closed"){
     location.reload()
   }
  })

  //MEDIA ENCODER DECODER STATE
  client.on('media-sdk-change', (payload) => {
      console.log("media-sdk-change: " + JSON.stringify(payload))
      if (payload.type === 'video' && payload.result === 'success') {
        if (payload.action === 'encode') {
          // encode for sending video stream
          videoEncode = true
        } else if (payload.action === 'decode') {
          // decode for receiving video stream
          videoDecode = true
        }
      }
      if (payload.type === 'audio' && payload.result === 'success') {
        if (payload.action === 'encode') {
          // encode for sending audio stream (speak)
          audioEncode = true
        } else if (payload.action === 'decode') {
          // decode for receiving audio stream (hear)
          audioDecode = true
        }
      }
      if (payload.type === 'share' && payload.result === 'success') {
        if (payload.action === 'encode') {
          // encode for sending share stream
          shareEncode = true
        } else if (payload.action === 'decode') {
          // decode for receiving share stream
          shareDecode = true
        }
      }
  })

  //LISETN TO FAREND VIDEO STATUS
  client.on('peer-video-state-change', (payload) => {
   console.log("peer-video-state-change: " + JSON.stringify(payload))
   if (payload.action === 'Start') {
     if(videoDecode){
       toggleFarVideo(stream, payload.userId, true)
     }else{
       console.log("wait untill videoDecode gets enabled")
       waitForVideoDecoder(500, payload.userId)
     }

   } else if (payload.action === 'Stop') {
　    toggleFarVideo(stream, payload.userId, false)
   }
　})

  //LISETEN FAREND SCREENSHARE STATUS
  client.on('active-share-change', (payload) => {
      console.log(`ScreenShare: active-share-change`, payload)
      console.log("ScreenShare active-share-change state: " + payload.state)
      if(payload.state == "Active"){
        console.log("state: " + payload.state)
        console.log("userId: " + payload.userId)
        if(shareDecode){
          let shareCanvas = document.getElementById('far-screenshare-canvas')
          stream.startShareView(shareCanvas, payload.userId)
        }else{
          console.log("wait untill shareDecode gets enabled")
          waitForShareDecoder(500, payload.userId)
        }
      }else if (payload.state == "Inactive"){
        stream.stopShareView()
        let shareCanvas = document.getElementById('far-screenshare-canvas')
        stream.clearVideoCanvas(shareCanvas)
      }
  })

  //STRIGGER WHEN EVER QOS STATISTIC GETS ENABLED(SUBSCRIBED)
  client.on('audio-statistic-data-change', (payload) => {
     console.log('audio-statistic-data-change', payload)
  })
  client.on('video-statistic-data-change', (payload) => {
     console.log('video-statistic-data-change', payload)
  })

  //GET PARAMETERS AND JOIN VSDK SESSION
  let topic = document.getElementById('session_topic').value
  let userName = document.getElementById('user_name').value
  let password = document.getElementById('session_pwd').value
  let role = document.getElementById('join-role').elements["joinRole"].value

  let token = await getSignature(topic, role, password)
  console.log(token)

  client.join(topic, token, userName, password).then(() => {
    stream = client.getMediaStream()
  }).catch((error) => {
    console.log(error)
  })

}

//LEAVE OR END SESSION
function leaveSession() {
  var n = client.getCurrentUserInfo()
  console.log("isHost: " + n.isHost)
  if(n.isHost){
    client.leave(true)
  }else{
    client.leave()
  }
}

//AUDIO START
async function audioStart() {

  let agent = navigator.userAgent;

  switch(true){
    case agent.includes("iPhone") || agent.includes("iPad") || agent.includes("Android"):
     try{
      await stream.startAudio()
      console.log("audioStart")
     } catch (e){
      console.log(e)
     }
    break
  }
  
}

//AUDIO STOP
async function audioStop() {

  let agent = navigator.userAgent;

  switch(true){
    case agent.includes("iPhone") || agent.includes("iPad") || agent.includes("Android"):
    try{
        await stream.stopAudio()
     } catch (e) {
        console.log(e)
     }
     console.log("audioStop")
    break
  }

}

//MIC MUTE UNMUTE
function micMuteUnmute() {
  if(!stream.isAudioMuted()){
    stream.muteAudio()
  }else{
    stream.unmuteAudio()
  }
  console.log("isAudioMuted: " + stream.isAudioMuted())
}

//LOCAL CAMERA START STOP
async function cameraStartStop() {

  let isVideoOn = await stream.isCapturingVideo()
  console.log("cameraStartStop isCapturingVideo: " + isVideoOn)

  let agent = navigator.userAgent;
  let selfId = client.getCurrentUserInfo().userId;

  switch(true){
    case agent.includes("iPhone") || agent.includes("iPad"):
    if(!isVideoOn){
      await stream.startVideo({mirrored: false})
      toggleSelfVideo(stream,selfId,!isVideoOn)
    } else {
      await stream.stopVideo()
      toggleSelfVideo(stream,selfId,!isVideoOn)
    }
    break
    case agent.includes("Android"):
    let localVideoTrack = ZoomVideo.createLocalVideoTrack()
    if(!isVideoOn){
      let selfVideo = document.getElementById('self-video-element')
      await localVideoTrack.start(selfVideo)
      await stream.startVideo({videoElement: selfVideo})
    }else{
      await localVideoTrack.stop()
      await stream.stopVideo()
    }
    break
  }
}

//SWITCH CAMERA
async function cameraSwitch() {

  let agent = navigator.userAgent;

  switch(true){
    case agent.includes("iPhone") || agent.includes("iPad") || agent.includes("Android"):
    let activeCameraId = await stream.getActiveCamera()
    console.log("Current camera source: " + activeCameraId)

    //let cameras = stream.getCameraList()
    //console.log("Selectable WebCam source: " + JSON.stringify(cameras))
    try{
        if(activeCameraId == "user"){
          await stream.switchCamera("environment");
        }else{
          await stream.switchCamera("user");
        }
    } catch (e){
        console.log(e);
    }
    break
    default:
  }

}

//ENABLE DISABLE QOS STATISTICS
var isEnableQOS = false
async function enableQOS() {
  if(!isEnableQOS){
    try{
      await stream.subscribeAudioStatisticData()
      await stream.subscribeVideoStatisticData()
      isEnableQOS = true
    } catch (error)  {
      console.log(error)
    }
  }else{
    try{
      await stream.unsubscribeAudioStatisticData()
      await stream.unsubscribeVideoStatisticData()
      isEnableQOS = false
    } catch (error)  {
      console.log(error)
    }
  }
  console.log("isenableQOS",isEnableQOS)
}


//TOGGLE NEAR END VIDEO ON CANVAS
const toggleSelfVideo = async (mediaStream, userId, isVideoOn) => {
    let SELF_VIDEO_CANVAS = document.getElementById('self-canvas-element')
    if (isVideoOn) {
        console.log("toggleSelfVideo start")
        //await mediaStream.startVideo()
        await mediaStream.renderVideo(
            SELF_VIDEO_CANVAS,
            userId,
            160,   // Size Width
            90,    // Size Height
            0,     // Starting point x (Vertical)
            0,     // Starting point y (Horizon)
            0      // Video Quality 0:90p, 1:180p, 2:360p, 3:720p
        )
    } else {
        console.log("toggleSelfVideo stop")
        await mediaStream.stopVideo()
        await mediaStream.stopRenderVideo(SELF_VIDEO_CANVAS, userId)
        await mediaStream.clearVideoCanvas(SELF_VIDEO_CANVAS)
    }
}

//TOGGLE FAR END VIDEO ON CANVAS
const toggleFarVideo = async (mediaStream, userId, isVideoOn) => {
    var FAR_VIDEO_CANVAS = document.getElementById('far-canvas-element')
    if (isVideoOn) {
        console.log("toggleFarVideo start")
        await mediaStream.renderVideo(
            FAR_VIDEO_CANVAS,
            userId,
            640/2,  // Size Width
            360/2,  // Size Height
            0,      // Starting point x (Vertical)
            90,     // Starting point y (Horizon)
            2       // Video Quality 0:90p, 1:180p, 2:360p, 3:720p
        )
    } else {
        console.log("toggleFarVideo stop")
        await mediaStream.stopRenderVideo(FAR_VIDEO_CANVAS, userId)
        await mediaStream.clearVideoCanvas(FAR_VIDEO_CANVAS)
    }
}

////////////////////////////////////////////////////////////////////////
// WAIT FOR DECODERS

//WAIT FOR VIDEO DECODER
async function waitForVideoDecoder(ms, userid){
let len = 10
 for (let i = 0; i < len; i++) {
  await sleep(ms)
  console.log("waiting for video decoder: " + i)
   if(videoDecode){
     toggleFarVideo(stream, userid, true)
     break
   }
 }
}

//WAIT FOR SCREENSHARE DECODER
async function waitForShareDecoder(ms, userid){
let len = 10
 for (let i = 0; i < len; i++) {
  await sleep(ms)
  console.log("Trying to wait for share decoder: " + i)
   if(shareDecode){
     let shareCanvas = document.getElementById('screenshare-canvas')
     stream.startShareView(shareCanvas, userid)
     break
   }
 }
}

//WAOT FOR AUDIO DECODER
async function waitForAudioDecoder(ms){
let len = 10
 for (let i = 0; i < len; i++) {
  await sleep(ms)
  console.log("Trying to wait for audio decoder: " + i)
   if(audioDecode){
     await stream.startAudio()
     console.log("audioStart")
     break
   }
 }
}

//SLEEP(WAIT)
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

////////////////////////////////////////////////////////////////////////
//　GET SIGNATURE FOR VSDK FOR WEB
function getSignature(topic, role, password) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest()
        //console.log("location.hostname: " + location.hostname)
        xhr.open('POST', './', true)
        xhr.setRequestHeader('content-type', 'application/json')
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                const obj = JSON.parse(xhr.response)
                //console.log("getSignature: " + xhr.response)
                resolve(obj.signature)
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                })
            }
        }
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            })
        }
        const body = JSON.parse('{}')
        body["topic"] = topic
        body["role"] = parseInt(role)
        body["password"] = password
        xhr.send(JSON.stringify(body))
    })
}
