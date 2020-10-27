import { ZoomApi } from './zoomApi';

((PLUGIN_ID) => {
  // フィールドコードを変数に格納
  const topic = 'topic';
  const start_time = 'start_time';
  const duration = 'duration';
  const Attendees = 'Attendees';
  const host = 'host';
  const meetingNumber = 'meetingNumber';
  const password = 'password';
  const join_url = 'join_url';
  const relatedZoomClient = 'relatedZoomClient';
  const joinSpace = 'join';
  const zoomSpace = 'zoom';

  // zoomClientアプリのIDを取得
  const zoomClientApp = kintone.app.getRelatedRecordsTargetAppId(relatedZoomClient);
  // ホストのrole番号「1」を代入
  const hostRole = 1;
  // 参加者のrole番号「0」を代入
  const attendRole = 0;
  const zoomapi = new ZoomApi(PLUGIN_ID);
  // ミーティングタイプは「2」の「Scheduled meeting」を指定
  const meetingType = 2;
  const loginUser = kintone.getLoginUser();

  // 「ホスト」「参加」ボタンを表示し、zoomミーティング画面表示用のiframeを用意する処理
  const detailHandle = event => {
    kintone.app.record.setFieldShown(relatedZoomClient, false);
    const zoomApp = kintone.app.getId();
    const record = event.record;

    if (document.getElementById('join') !== null) {
      return;
    }

    // 「zoom」のスペースフィールドにzoom画面表示用のiframeを用意
    const addZoomDom = zoomClientUrl => {
      if (document.getElementById('zoom') !== null) {
        document.getElementById('zoom').remove();
      }
      const zoomDiv = document.createElement('div');
      const zoomIframe = `<div id="zoom"><iframe style="border:none; height: 600px; width: 100%;" src= ${zoomClientUrl} 
            sandbox="allow-forms allow-scripts allow-same-origin" allow="microphone; camera"></iframe></div>`;
      zoomDiv.innerHTML = zoomIframe;
      kintone.app.record.getSpaceElement(zoomSpace).appendChild(zoomDiv);
    };

    // 「ホスト」フィールドにユーザーを追加する処理
    const updateHost = () => {
      const updateHostParams = {
        'app': zoomApp,
        'id': kintone.app.record.getId(),
        'record': {
          host: {
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

    // ホストの値を確認する処理
    const checkTheHost = () => {
      const checkTheHostParams = {
        'app': zoomApp,
        'id': kintone.app.record.getId()
      };
      return kintone.api(kintone.api.url('/k/v1/record', true), 'GET', checkTheHostParams).then(resp => {
        return resp.record[host].value;
      }, error => {
        return Promise.reject(error);
      });
    };

    // 「出席者」フィールドにユーザーを追加する処理
    const updateRealAttend = () => {
      const updateRealAttendParams = {
        'app': zoomApp,
        'id': kintone.app.record.getId()
      };
      kintone.api(kintone.api.url('/k/v1/record', true), 'GET', updateRealAttendParams).then(resp => {
        const AttendeesValue = resp.record[Attendees].value;
        for (const value of AttendeesValue) {
          if ('code' in value && value.code === loginUser.code) {
            return;
          }
        }

        const newAttend = {
          'code': loginUser.code
        };
        AttendeesValue.push(newAttend);
        const params = {
          'app': zoomApp,
          'id': kintone.app.record.getId(),
          'record': {
            [Attendees]: {
              'value': AttendeesValue
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

    // データを初期化し、「ホスト」「参加」ボタンを生成
    const zoom = {
      init: function () {
        this.addHost();
        this.addJoin();
      },
      addHost() {
        const hostButton = document.createElement('button');
        hostButton.id = 'host';
        hostButton.innerText = 'Host';
        hostButton.className = 'btn btn-primary';
        kintone.app.record.getSpaceElement(joinSpace).appendChild(hostButton);

        // 「ホスト」ボタンがクリックされたときの処理
        hostButton.onclick = () => {
          // 「出席者」フィールドにユーザーを追加する処理
          updateHost();
          updateRealAttend();
          const meetingNumberValue = record[meetingNumber].value;
          const passwordValue = record[password].value;
          const zoomClientUrl = `/k/${zoomClientApp}/?meetingNumber=${meetingNumberValue}&password=${passwordValue}&role=${hostRole}`;
          // zoomミーティングの画面をiframeに表示
          addZoomDom(zoomClientUrl);
        };
      },
      addJoin() {
        const joinButton = document.createElement('button');
        joinButton.id = 'attend';
        joinButton.innerText = 'Attend';
        joinButton.className = 'btn btn-info';
        joinButton.setAttribute('style', 'margin-left:10px;');
        kintone.app.record.getSpaceElement(joinSpace).appendChild(joinButton);

        // 「ホスト」ボタンがクリックされたときの処理
        joinButton.onclick = () => {
          // 「ホスト」の参加を確認する処理
          checkTheHost().then(resp => {
            if (resp.length === 0) {
              alert('ホストが本ミーティングを開始するまでお待ちください');
              return;
            }
            // 「出席者」フィールドにユーザーを追加
            updateRealAttend();
            const meetingNumberValue = record[meetingNumber].value;
            const passwordValue = record.password.value;
            const zoomClientUrl = `/k/${zoomClientApp}/?meetingNumber=${meetingNumberValue}&password=${passwordValue}&role=${attendRole}`;
            // zoomミーティングの画面をiframeに表示
            addZoomDom(zoomClientUrl);
          }, error => {
            console.log(error);
          });
        };
      }
    };
    zoom.init();
  };
  // レコード詳細画面が表示されたときに、
  // 「ホスト」「参加」ボタンを表示し、zoom画面表示用のiframeを用意する処理
  kintone.events.on('app.record.detail.show', detailHandle);
  // レコードが保存されたときに、記入された「会議名」「開始時間」「会議時間」などの情報をもとにzoomミーティングを生成
  kintone.events.on('app.record.create.submit', async event => {
    const record = event.record;
    const data = {
      [topic]: record[topic].value,
      'type': meetingType,
      [start_time]: record[start_time].value,
      [duration]: record[duration].value,
      'timezone': loginUser.timezone
    };
    // zoomユーザー情報を取得
    const user = await zoomapi.getUsers().catch(error => {
      const resp = JSON.parse(error[0]);
      alert(resp.message);
    });
    if (!user) return event;
    const userId = user.users[0].id;
    // 取得したzoomユーザー情報と記入された会議情報でzoomミーティングを生成
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
  // レコード作成/編集、一覧編集画面が表示されるときの処理
  kintone.events.on(['app.record.create.show', 'app.record.edit.show', 'app.record.index.edit.show'], event => {
    const record = event.record;
    // 「会議名」「会議パスワード」「会議URL」などの情報を編集不可にする
    record[meetingNumber].disabled = true;
    record[password].disabled = true;
    record[join_url].disabled = true;
    // 「出席者」「ホスト」フィールドを非表示にする
    kintone.app.record.setFieldShown(Attendees, false);
    kintone.app.record.setFieldShown(host, false);
    return event;
  });

  // レコードを削除するときに、ミーティングの削除をzoomへ反映する処理
  kintone.events.on(['app.record.detail.delete.submit', 'app.record.index.delete.submit'], event => {
    const record = event.record;
    const meetingId = Number(record[meetingNumber].value);
    return zoomapi.deleteMeeting(meetingId).catch(error => {
      const resp = JSON.parse(error[0]);
      alert(resp.message);
    });
  });
})(kintone.$PLUGIN_ID);
