window.addEventListener('DOMContentLoaded', function(event) {
  console.log('DOM fully loaded and parsed');
  websdkready();
});

function websdkready() {
  console.log("ready");
  const zoomMeetingSDK = document.getElementById('zmmtg-root')
  zoomMeetingSDK.style.display = 'none';

  console.log("checkSystemRequirements");
  console.log(JSON.stringify(ZoomMtg.checkSystemRequirements()));
  ZoomMtg.preLoadWasm();

  // click join meeting button
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
        var leaveUrl = "./";
        ZoomMtg.prepareJssdk();
        //ZoomMtg.i18n.load('jp-JP');
        //ZoomMtg.i18n.reload('jp-JP');
        ZoomMtg.init({
          leaveUrl: leaveUrl,
          //disablePreview: true, // default false
          success: function () {
            console.log("signature: ", signature);
            zoomMeetingSDK.style.display = 'block';
            ZoomMtg.join({
              meetingNumber: meetingid,
              userName: name,
              signature: signature,
              sdkKey: sdkkey,
              passWord: meetingpwd,
              success: function (res) {
                console.log("join meeting success");
              },
              error: function (res) {
                console.log(res);
              },
            });
          },
          error: function (res) {
            console.log(res);
          },
        });

        /*
        ZoomMtg.inMeetingServiceListener('onUserJoin', function (data) {
          console.log('inMeetingServiceListener onUserJoin', data);
        });

        ZoomMtg.inMeetingServiceListener('onUserLeave', function (data) {
          console.log('inMeetingServiceListener onUserLeave', data);
        });

        ZoomMtg.inMeetingServiceListener('onUserIsInWaitingRoom', function (data) {
          console.log('inMeetingServiceListener onUserIsInWaitingRoom', data);
        });

        ZoomMtg.inMeetingServiceListener('onMeetingStatus', function (data) {
          console.log('inMeetingServiceListener onMeetingStatus', data);
        });
        ZoomMtg.inMeetingServiceListener('onPreviewPannel', function (data) {
          console.log('inMeetingServiceListener onPreviewPannel', data);
        });

        ZoomMtg.inMeetingServiceListener('receiveSharingChannelReady', function (data) {
          console.log('inMeetingServiceListener onShareStarted', data);
        });

        ZoomMtg.inMeetingServiceListener('onReceiveTranscriptionMsg', function (data) {
          console.log('inMeetingServiceListener onReceiveTranscriptionMsg', data);
        });

        ZoomMtg.inMeetingServiceListener('onReceiveTranslateMsg', function (data) {
          console.log('inMeetingServiceListener onReceiveTranslateMsg', data);
        });

        ZoomMtg.inMeetingServiceListener('onAudioQos', function (data) {
          console.log('inMeetingServiceListener onAudioQos', data);
        });

        ZoomMtg.inMeetingServiceListener('onVideoQos', function (data) {
          console.log('inMeetingServiceListener onVideoQos', data);
        });
        */

      });
  });

  //get signature for WebSDK
  function getSignature(meeting_number, role, callback){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {

        if(callback) callback(xhr.responseText);
      }
    }
    xhr.open('POST', '/', true);
    xhr.setRequestHeader('content-type', 'application/json');
    const body = '{"meetingNumber":"' + meeting_number +'", "role":'+ role +'}';
    console.log("body: " + body);
    xhr.send(body);
  };

};

//MEETING QOS ENABLE/DISABLE
/*
var QOSstatus = false;
function enableQOS(){
  console.log("ZoomMtg.subscribeStatisticData");
  if(!QOSstatus){
    ZoomMtg.subscribeStatisticData({
      audio: true,
      video: true,
      success: function (e) {
        console.log('subscribeStatisticData',e);
        QOSstatus = true;
      },
      error: function (e) {
        console.log('subscribeStatisticData',e);
      },
    });
  }else{
    ZoomMtg.unSubscribeStatisticData({
      audio: true,
      video: true,
      success: function (e) {
        console.log('unSubscribeStatisticData',e);
        QOSstatus = false;
      },
      error: function (e) {
        console.log('unSubscribeStatisticData',e);
      },
    });
  }
};
*/
