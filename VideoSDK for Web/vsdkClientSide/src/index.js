import ZoomVideo from '@zoom/videosdk';

const client = ZoomVideo.createClient();
var stream;
//let videoDecode;
//let videoEncode;
let audioDecode;
let audioEncode;

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('join-button').addEventListener('click', joinSession);
    document.getElementById('leave-button').addEventListener('click', leaveSession);
    document.getElementById('audio-button').addEventListener('click', audioStart);
    document.getElementById('mic-button').addEventListener('click', micMuteUnmute);
    document.getElementById('qos-button').addEventListener('click', enableQOS);
    console.log('DOMContentLoaded');
});

async function joinSession() {

  //EVENT LISTENER
  client.on('connection-change', (payload) => {
   console.log("Connection Change: ", payload);
  });

  client.on('peer-video-state-change', (payload) => {
   console.log("peer-video-state-change: " + JSON.stringify(payload));
   if (payload.action === 'Start') {
　    toggleFarVideo(stream, payload.userId, true);
   } else if (payload.action === 'Stop') {
　    toggleFarVideo(stream, payload.userId, false);
   }
　});

  client.on('media-sdk-change', (payload) => {
    console.log("media-sdk-change: " + JSON.stringify(payload));
    /*if (payload.type === 'video' && payload.result === 'success') {
      if (payload.action === 'encode') {
        // encode for sending video stream
        videoEncode = true
      } else if (payload.action === 'decode') {
        // decode for receiving video stream
        videoDecode = true
      }
    }
    */
    if (payload.type === 'audio' && payload.result === 'success') {
      if (payload.action === 'encode') {
        // encode for sending audio stream (speak)
        audioEncode = true
      } else if (payload.action === 'decode') {
        // decode for receiving audio stream (hear)
        audioDecode = true
      }
    }
  });


  //ENABLE QOS STATISTIC
  client.on('audio-statistic-data-change', (payload) => {
     console.log('audio-statistic-data-change', payload);
  });

  client.on('video-statistic-data-change', (payload) => {
     console.log('video-statistic-data-change', payload);
  });

  //INIT VSDK CLIENT
  //client.init('en-US', 'CDN');
  client.init('en-US', location.origin + '/lib');

  var topic = document.getElementById('session_topic').value;
  var userName = document.getElementById('user_name').value;
  var password = document.getElementById('session_pwd').value;
  var role = document.getElementById('join-role').elements["joinRole"].value;

  /*
  console.log("topic " + topic);
  console.log("userName " + userName);
  console.log("password " + password);
  console.log("role " + role);
  */

  //JOIN VSDK SESSION
  var token = await getSignature(topic, role, password);
  console.log(token);

  client.join(topic, token, userName, password).then(() => {
    stream = client.getMediaStream();
    var n = client.getCurrentUserInfo();
    console.log("getCurrentUserInfo: ", n);

    var selfId = n.userId;
    console.log("selfId: ", selfId);
    toggleSelfVideo(stream, selfId, true);

  }).catch((error) => {
    console.log(error)
  })

};

//LEAVE OR END SESSION
function leaveSession() {
  var n = client.getCurrentUserInfo();
  console.log("isHost: " + n.isHost);
  if(n.isHost){
    client.leave(true);
  }else{
    client.leave();
  }
};

//AUDIO START STOP
function audioStart() {
  var isSafari = window.safari !== undefined;
  if(isSafari) {
    if(audioEncode && audioDecode){
      try{
        stream.startAudio();
      } catch (e){
        console.log(e);
      }
    } else {
       console.log('safari audio has not finished initializing');
    }
  } else {
    try{
      stream.startAudio();
    } catch (e){
      console.log(e);
    }
  }
};

//MIC MUTE UNMUTE
function micMuteUnmute() {
  if(!stream.isAudioMuted()){
    stream.muteAudio();
  }else{
    stream.unmuteAudio();
  }
  console.log("isAudioMuted: " + stream.isAudioMuted());
};


//ENABLE DISABLE QOS STATISTICS
var isEnableQOS = false;
async function enableQOS() {
  if(!isEnableQOS){
    try{
      await stream.subscribeAudioStatisticData();
      await stream.subscribeVideoStatisticData();
      isEnableQOS = true;
    } catch (error)  {
      console.log(error);
    }
  }else{
    try{
      await stream.unsubscribeAudioStatisticData();
      await stream.unsubscribeVideoStatisticData();
      isEnableQOS = false;
    } catch (error)  {
      console.log(error);
    }
  }
  console.log("isenableQOS",isEnableQOS);
};


//TOGGLE NEAR END VIDEO ON CANVAS
const toggleSelfVideo = async (mediaStream, userId, isVideoOn) => {
    var VIDEO_CANVAS = document.getElementById('video-canvas');
    if (isVideoOn) {
        console.log("toggleSelfVideo start");
        await mediaStream.startVideo();
        await mediaStream.renderVideo(
            VIDEO_CANVAS,
            userId,
            640/2,  // Size Width
            360/2,  // Size Height
            640/2,  // Starting point x
            90,     // Starting point y
            2       // Video Quality 0:90p, 1:180p, 2:360p, 3:720p
        );
    } else {
        console.log("toggleVideo stop");
        await mediaStream.stopVideo();
        await mediaStream.stopRenderVideo(VIDEO_CANVAS, userId);
        await mediaStream.clearVideoCanvas(VIDEO_CANVAS);
    }
}

//TOGGLE FAR END VIDEO ON CANVAS
const toggleFarVideo = async (mediaStream, userId, isVideoOn) => {
    var VIDEO_CANVAS = document.getElementById('video-canvas');
    if (isVideoOn) {
        console.log("toggleFarVideo start");
        await mediaStream.renderVideo(
            VIDEO_CANVAS,
            userId,
            640/2,  // Size Width
            360/2,  // Size Height
            0,      // Starting point x
            90,     // Starting point y
            2       // Video Quality 0:90p, 1:180p, 2:360p, 3:720p
        );
    } else {
        console.log("toggleFarVideo stop");
        await mediaStream.stopRenderVideo(VIDEO_CANVAS, userId);
        await mediaStream.clearVideoCanvas(VIDEO_CANVAS);
    }
};


//　GET SIGNATURE FOR VSDK FOR WEB
function getSignature(topic, role, password) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        //console.log("location.hostname: " + location.hostname);
        xhr.open('POST', 'http://' + location.hostname + ':4001/', true);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                const obj = JSON.parse(xhr.response);
                //console.log("getSignature: " + xhr.response);
                resolve(obj.signature);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        const body = JSON.parse('{}');
        body["topic"] = topic;
        body["role"] = parseInt(role);
        body["password"] = password;
        xhr.send(JSON.stringify(body));
    });
};
