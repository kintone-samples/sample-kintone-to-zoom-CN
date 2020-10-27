export class ZoomApi {
  constructor(PLUGIN_ID) {
    this.preUrl = 'https://api.zoom.us/v2';
    this.plugin_id = PLUGIN_ID;
  }

  zoomUrl(apiUrl) {
    return this.preUrl + apiUrl;
  }

  // zoomユーザーを取得する処理
  getUsers() {
    const apiUrl = '/users';

    return kintone.plugin.app.proxy(this.plugin_id, this.zoomUrl(apiUrl), 'GET', {}, '').then(args => {
      if (args[1] === 200) {
        const resp = JSON.parse(args[0]);
        return resp;
      }

      return Promise.reject(args);

    }).catch(error => {
      return Promise.reject(error);
    });
  }

  // zoomミーティングを生成する処理
  createMeeting(userId, data) {
    const apiUrl = `/users/${userId}/meetings`;
    const headers = {
      'Content-Type': 'application/json'
    };
    return kintone.plugin.app.proxy(this.plugin_id, this.zoomUrl(apiUrl), 'POST', headers, data).then(args => {
      if (args[1] === 201) {
        const resp = JSON.parse(args[0]);
        return resp;
      }

      return Promise.reject(args);

    }).catch(error => {
      return Promise.reject(error);
    });
  }

  // zoomミーティングを削除する処理
  deleteMeeting(meetingId) {
    const apiUrl = `/meetings/${meetingId}`;
    return kintone.plugin.app.proxy(this.plugin_id, this.zoomUrl(apiUrl), 'DELETE', {}, '').then(args => {
      if (args[1] !== 204) alert('update to zoom failed');
    }).catch(error => {
      return Promise.reject(error);
    });
  }
}
