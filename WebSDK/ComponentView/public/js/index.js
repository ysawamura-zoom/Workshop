window.addEventListener('DOMContentLoaded', function(event) {
  console.log('DOM fully loaded and parsed');
  websdkready();
});

function websdkready() {
  console.log("ready");

  let meetingSDKElement = document.getElementById('meetingSDKElement');
  let zmClient = ZoomMtgEmbedded.createClient();

  zmClient.init({
      debug: true,
      zoomAppRoot: meetingSDKElement,
      //language: "jp-JP", //default "en-US",
      /*customize: {
        //meetingInfo: ['topic', 'host', 'mn', 'pwd', 'telPwd', 'invite', 'participant', 'dc', 'enctype'],
        meetingInfo: ['topic'],
        toolbar: {
          buttons: [
            {
              text: 'CustomizeButton',
              className: 'CustomizeButton',
              onClick: () => {
                console.log('click Custom Button');
              }
            },
            {
              text: 'Enable/Disable QOS',
              className: 'CustomizeButton',
              onClick: () => {
                console.log('click enableQOS');
                enableQOS();
              }
            },
          ]
        }
      }
      */
  }).then((e) => {
      console.log('init success', e);
  }).catch((e) => {
      console.log('init error', e);
  });

  //WHEN JOIN IS CLICKED
  document.getElementById("join_meeting").addEventListener("click", async function (e) {
      e.preventDefault();
      console.log("click join");
      var meetingid = document.getElementById("meeting_number").value;
      var meetingrole = document.getElementById("meeting_role").value;

      getSignature(meetingid,meetingrole,function(callback){
        var obj = JSON.parse(callback);
        var sdkkey = obj.sdkkey;
        var signature = obj.signature;
        var name = document.getElementById("display_name").value;
        var meetingpwd = document.getElementById("meeting_pwd").value;
        //var leaveUrl = "./";
        // WebSDK Embedded join
        zmClient.join({
          sdkKey: sdkkey,
          signature: signature,
          meetingNumber: meetingid,
          userName: name,
          password: meetingpwd,
          //userEmail: meetingConfig.email,
          role: 0,
        }).then((e) => {
          console.log('join success', e);
          //StartAudio();
          /*
          zmClient.on('audio-statistic-data-change', (payload) => {
              console.log('audio-statistic-data-change', payload);
          });
          zmClient.on('video-statistic-data-change', (payload) => {
              console.log('video-statistic-data-change', payload);
          });
          */
        }).catch((e) => {
          console.log('join error', e);
        });
      });

  });

  //　GET SIGNATURE FOR WEBSDK
  function getSignature(meeting_number, role, callback){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      console.log("getSignature: " + xhr.responseText);
      if(callback) callback(xhr.responseText);
      }
    }
    xhr.open('POST', '/', true);
    xhr.setRequestHeader('content-type', 'application/json');
    const body = '{"meetingNumber":"' + meeting_number +'", "role":'+ role +'}';
    console.log("body: " + body);
    xhr.send(body);
  };

  //START AUDIO BY CLICKING ICON PROGRAMATICALLY
  /*function StartAudio(){
    var buttonFound = false;
    var t = setInterval(function(){
    console.log("interval started");
    var startButton = document.getElementsByClassName("zmwebsdk-MuiButtonBase-root zmwebsdk-MuiButton-root zmwebsdk-makeStyles-root-37 zmwebsdk-MuiButton-text zmwebsdk-MuiButton-textSizeSmall zmwebsdk-MuiButton-sizeSmall zmwebsdk-MuiButton-disableElevation");
    if(startButton!=null && !buttonFound){
      for(var i=0;i<startButton.length;i++){
        if(startButton[i].title == "Audio"){
          startButton[i].click()
          console.log("click i: " + i);
          buttonFound = true;
        }
      }
    } else if (buttonFound){
        console.log("clear interval");
        clearInterval(t);
      }
    },500);
  };
  */

  //MEETING QOS ENABLE/DISABLE
  /*var QOSstatus = false;
  function enableQOS(){
    console.log("enableQOS");
    if(!QOSstatus){
      try{
        zmClient.subscribeStatisticData({audio: true, video: true});
        console.log("enableQOS: subscribeStatisticData");
        QOSstatus = true;
      }catch(e){
        console.log(e);
      }
    }else{
      try{
        zmClient.unSubscribeStatisticData({audio: true, video: true});
        console.log("enableQOS: unSubscribeStatisticData");
        QOSstatus = false;
      }catch(e){
        console.log(e);
      }
    }
  }
  */


};
