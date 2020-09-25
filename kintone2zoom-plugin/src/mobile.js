import {ZoomApi} from './zoomApi';

((PLUGIN_ID) => {
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!('token' in config)) {
    return;
  }
  const token = config.token;

  const zoomClientApp = kintone.mobile.app.getRelatedRecordsTargetAppId('relatedZoomClient');
  const hostRole = 1;
  const attendRole = 0;
  const zoomapi = new ZoomApi(token);
  const meetingType = 2;

  const detailHandle = event => {
    kintone.mobile.app.record.setFieldShown('relatedZoomClient', false);
    const zoomApp = kintone.mobile.app.getId();
    const record = event.record;

    if (document.getElementById('join') !== null) {
      return;
    }
    const loginUser = kintone.getLoginUser();

    const updateHost = () => {
      const params = {
        'app': zoomApp,
        'id': kintone.mobile.app.record.getId(),
        'record': {
          'host': {
            'value': [
              {
                'code': loginUser.code
              }
            ]
          }
        }
      };
      kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params).catch(error => {
        console.log(error);
      });
    };

    const checkTheHost = () => {
      const params = {
        'app': zoomApp,
        'id': kintone.mobile.app.record.getId()
      };
      return kintone.api(kintone.api.url('/k/v1/record', true), 'GET', params).then(resp => {
        return resp.record.host.value;
      }, error => {
        return Promise.reject(error);
      });
    };

    const updateRealAttend = () => {
      const getParams = {
        'app': zoomApp,
        'id': kintone.mobile.app.record.getId()
      };
      kintone.api(kintone.api.url('/k/v1/record', true), 'GET', getParams).then(resp => {
        const realAttends = resp.record.realAttends.value;
        for (const value of realAttends) {
          if ('code' in value && value.code === loginUser.code) {
            return;
          }
        }

        const newAttend = {
          'code': loginUser.code
        };
        realAttends.push(newAttend);
        const params = {
          'app': zoomApp,
          'id': kintone.mobile.app.record.getId(),
          'record': {
            'realAttends': {
              'value': realAttends
            }
          }
        };
        kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params).catch(error => {
          console.log(error);
        });
      }, error => {
        console.log(error);
      });
    };

    const zoom = {
      init: function() {
        this.addHost();
        this.addJoin();
      },
      addHost() {
        const hostButton = document.createElement('button');
        hostButton.id = 'host';
        hostButton.innerText = 'Host';
        hostButton.className = 'btn btn-primary';
        kintone.mobile.app.record.getSpaceElement('join').appendChild(hostButton);

        hostButton.onclick = () => {
          updateHost();
          updateRealAttend();
          const meetingNumber = record.meetingNumber.value;
          const password = record.password.value;
          const zoomClientUrl = `/k/m/${zoomClientApp}/?meetingNumber=${meetingNumber}&password=${password}&role=${hostRole}`;
          window.open(zoomClientUrl);
        };
      },
      addJoin() {
        const joinButton = document.createElement('button');
        joinButton.id = 'attend';
        joinButton.innerText = 'Attend';
        joinButton.className = 'btn btn-info';
        joinButton.setAttribute('style', 'margin-left:10px;');
        kintone.mobile.app.record.getSpaceElement('join').appendChild(joinButton);

        joinButton.onclick = () => {
          checkTheHost().then(resp => {
            if (resp.length === 0) {
              alert('Please waiting for the host');
              return;
            }
            updateRealAttend();
            const meetingNumber = record.meetingNumber.value;
            const password = record.password.value;
            const zoomClientUrl = `/k/m/${zoomClientApp}/?meetingNumber=${meetingNumber}&password=${password}&role=${attendRole}`;
            window.open(zoomClientUrl);
          });
        };
      }
    };
    zoom.init();
  };
  kintone.events.on('mobile.app.record.detail.show', detailHandle);

  kintone.events.on('mobile.app.record.create.submit', async event => {
    const record = event.record;
    const data = {
      'topic': record.topic.value,
      'type': meetingType,
      'start_time': record.start_time.value,
      'duration': record.duration.value
    };
    const user = await zoomapi.getUsers().catch(e => {
      const resp = JSON.parse(e[0]);
      alert(resp.message);
    });
    if (!user) return;
    const userId = user.users[0].id;
    const meetingInfo = await zoomapi.createMeeting(userId, data).catch(e => {
      const resp = JSON.parse(e[0]);
      alert(resp.message);
    });
    if (!meetingInfo) return;
    record.meetingNumber.value = meetingInfo.id;
    record.join_url.value = meetingInfo.join_url;
    record.password.value = meetingInfo.encrypted_password;

  });

  kintone.events.on(['mobile.app.record.create.show', 'mobile.app.record.index.edit.show', 'mobile.app.record.edit.show'], event => {
    const record = event.record;
    record.meetingNumber.disabled = true;
    record.password.disabled = true;
    record.join_url.disabled = true;
    kintone.mobile.app.record.setFieldShown('realAttends', false);
    kintone.mobile.app.record.setFieldShown('host', false);
    return event;
  });

  kintone.events.on(['mobile.app.record.detail.delete.submit', 'mobile.app.record.index.delete.submit'], event => {
    const record = event.record;
    const meetingId = Number(record.meetingNumber.value);
    return zoomapi.deleteMeeting(meetingId).catch(e => {
      const resp = JSON.parse(e[0]);
      alert(resp.message);
    });
  });
})(kintone.$PLUGIN_ID);

