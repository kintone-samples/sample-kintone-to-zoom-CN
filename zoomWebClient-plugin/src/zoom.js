(function(PLUGIN_ID) {
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!('api_key' in config) || !('api_secret' in config)) {
    document.getElementById('zmmtg-root').remove();
    return;
  }
  const API_KEY = config.api_key;
  const API_SECRET = config.api_secret;

  const zoomStart = function() {
    const query = window.location.search.substring(1);
    if (query == '') {
      document.getElementById('zmmtg-root').remove();
      return;
    }
    const queryList = testTool.parseQuery();
    const userName = kintone.getLoginUser().name;
    const meetingConfig = {
      apiKey: API_KEY,
      meetingNumber: queryList.meetingNumber,
      userName: (function() {
        if (userName) {
          try {
            return testTool.b64DecodeUnicode(userName);
          } catch (e) {
            return userName;
          }
        }
        return 'Guest';
      })(),
      passWord: queryList.password,
      leaveUrl: '/k/#/portal',
      role: parseInt(queryList.role, 10),
    };

    if (testTool.isMobileDevice()) {
      vConsole = new VConsole();
    }

    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareJssdk();

    const beginJoin = function(signature) {
      ZoomMtg.init({
        leaveUrl: meetingConfig.leaveUrl,
        success: function() {
          $.i18n.reload(meetingConfig.lang);
          ZoomMtg.join({
            meetingNumber: meetingConfig.meetingNumber,
            userName: meetingConfig.userName,
            signature: signature,
            apiKey: meetingConfig.apiKey,
            passWord: meetingConfig.passWord,
            success: function(res) {
              ZoomMtg.getAttendeeslist({});
              ZoomMtg.getCurrentUser({
                success: function(res) {
                },
              });
            },
            error: function(res) {
              console.log(res);
            },
          });
        },
        error: function(res) {
          console.log(res);
        },
      });
    };

    ZoomMtg.generateSignature({
      meetingNumber: meetingConfig.meetingNumber,
      apiKey: API_KEY,
      apiSecret: API_SECRET,
      role: meetingConfig.role,
      success: function(res) {
        meetingConfig.signature = res.result;
        meetingConfig.apiKey = API_KEY;
        beginJoin(meetingConfig.signature);
      },
    });
  };

  kintone.events.on(['mobile.app.record.index.show', 'app.record.index.show'], zoomStart);
})(kintone.$PLUGIN_ID);