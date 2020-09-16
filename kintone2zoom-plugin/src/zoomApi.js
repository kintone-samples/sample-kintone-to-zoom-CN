export class zoomApi {
    constructor(token) {
        this.preUrl = "https://api.zoom.us/v2";
        this.authorization = `Bearer ${token}`;
    }

    zoomUrl(apiUrl) {
        return this.preUrl + apiUrl;
    }

    getUsers() {
        let apiUrl = '/users';
        let headers = {
            'authorization': this.authorization
        };

        return kintone.proxy(this.zoomUrl(apiUrl), 'GET', headers, '').then(args => {
            let resp = JSON.parse(args[0]);
            return resp;
        }).catch(e => {
            console.log(e);
        });
    }

    createMeeting(userId, data) {
        let apiUrl = `/users/${userId}/meetings`;
        let headers = {
            'authorization': this.authorization,
            'Content-Type': 'application/json'
        };
        return kintone.proxy(this.zoomUrl(apiUrl), 'POST', headers, data).then(args => {
            let resp = JSON.parse(args[0]);
            return resp;
        }).catch(e => {
            console.log(e);
        });
    }

    deleteMeeting(meetingId) {
        let apiUrl = `meetings/${meetingId}`;
        let headers = {
            'authorization': this.authorization
        };
        return kintone.proxy(this.zoomUrl(apiUrl), 'DELETE', headers, '').then(args => {
            if (args[1] !== 204) alert("update to zoom failed");
        }).catch(e => {
            console.log(e);
        });
    }
}