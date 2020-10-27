import {ZoomApi} from './zoomApi';

((PLUGIN_ID) => {

  const topic = 'topic';
  const start_time = 'start_time';
  const duration = 'duration';
  const realAttends = 'realAttends';
  const host = 'host';
  const meetingNumber = 'meetingNumber';
  const password = 'password';
  const join_url = 'join_url';
  const relatedZoomClient = 'relatedZoomClient';
  const joinSpace = 'join';

  const zoomClientApp = kintone.mobile.app.getRelatedRecordsTargetAppId(relatedZoomClient);
  const hostRole = 1;
  const attendRole = 0;
  const zoomapi = new ZoomApi(PLUGIN_ID);
  const meetingType = 2;

  const detailHandle = event => {
    kintone.mobile.app.record.setFieldShown(relatedZoomClient, false);
    const zoomApp = kintone.mobile.app.getId();
    const record = event.record;

    if (document.getElementById('join') !== null) {
      return;
    }
    const loginUser = kintone.getLoginUser();

    const updateHost = () => {
      const updateHostParams = {
        'app': zoomApp,
        'id': kintone.mobile.app.record.getId(),
        'record': {
          [host]: {
            'value': [
              {
                'code': loginUser.code
              }
            ]
          }
        }
      };
      kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', updateHostParams).catch(error => {
        console.log(error);
      });
    };

    const checkTheHost = () => {
      const checkTheHostParams = {
        'app': zoomApp,
        'id': kintone.mobile.app.record.getId()
      };
      return kintone.api(kintone.api.url('/k/v1/record', true), 'GET', checkTheHostParams).then(resp => {
        return resp.record[host].value;
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
        const realAttendsValue = resp.record[realAttends].value;
        for (const value of realAttendsValue) {
          if ('code' in value && value.code === loginUser.code) {
            return;
          }
        }

        const newAttend = {
          'code': loginUser.code
        };
        realAttendsValue.push(newAttend);
        const updateRealAttendParams = {
          'app': zoomApp,
          'id': kintone.mobile.app.record.getId(),
          'record': {
            'realAttends': {
              'value': realAttendsValue
            }
          }
        };
        kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', updateRealAttendParams).catch(error => {
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
        kintone.mobile.app.record.getSpaceElement(joinSpace).appendChild(hostButton);

        hostButton.onclick = () => {
          updateHost();
          updateRealAttend();
          const meetingNumberValue = record[meetingNumber].value;
          const passwordValue = record[password].value;
          const zoomClientUrl = `/k/m/${zoomClientApp}/?meetingNumber=${meetingNumberValue}&password=${passwordValue}&role=${hostRole}`;
          window.open(zoomClientUrl);
        };
      },
      addJoin() {
        const joinButton = document.createElement('button');
        joinButton.id = 'attend';
        joinButton.innerText = 'Attend';
        joinButton.className = 'btn btn-info';
        joinButton.setAttribute('style', 'margin-left:10px;');
        kintone.mobile.app.record.getSpaceElement(joinSpace).appendChild(joinButton);

        joinButton.onclick = () => {
          checkTheHost().then(resp => {
            if (resp.length === 0) {
              alert('ホストが本ミーティングを開始するまでお待ちください');
              return;
            }
            updateRealAttend();
            const meetingNumberValue = record[meetingNumber].value;
            const passwordValue = record[password].value;
            const zoomClientUrl = `/k/m/${zoomClientApp}/?meetingNumber=${meetingNumberValue}&password=${passwordValue}&role=${attendRole}`;
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
      [topic]: record[topic].value,
      'type': meetingType,
      [start_time]: record[start_time].value,
      [duration]: record[duration].value
    };
    const user = await zoomapi.getUsers().catch(error => {
      const resp = JSON.parse(error[0]);
      alert(resp.message);
    });
    if (!user) return event;
    const userId = user.users[0].id;
    const meetingInfo = await zoomapi.createMeeting(userId, data).catch(error => {
      const resp = JSON.parse(error[0]);
      alert(resp.message);
    });
    if (!meetingInfo) return event;
    record[meetingNumber].value = meetingInfo.id;
    record[join_url].value = meetingInfo.join_url;
    record[password].value = meetingInfo.encrypted_password;
    return event;
  });

  kintone.events.on(['mobile.app.record.create.show', 'mobile.app.record.index.edit.show', 'mobile.app.record.edit.show'], event => {
    const record = event.record;
    record[meetingNumber].disabled = true;
    record[password].disabled = true;
    record[join_url].disabled = true;
    kintone.mobile.app.record.setFieldShown('realAttends', false);
    kintone.mobile.app.record.setFieldShown(host, false);
    return event;
  });

  kintone.events.on(['mobile.app.record.detail.delete.submit', 'mobile.app.record.index.delete.submit'], event => {
    const record = event.record;
    const meetingId = Number(record[meetingNumber].value);
    // eslint-disable-next-line no-trailing-spaces
    return zoomapi.deleteMeeting(meetingId).catch(error => { 
      const resp = JSON.parse(error[0]);
      alert(resp.message);
    });
  });
})(kintone.$PLUGIN_ID);
