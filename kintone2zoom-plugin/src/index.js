import { zoomApi } from './zoomApi';

((PLUGIN_ID) => {
    const config = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!('token' in config)) {
        return;
    }
    const token = config.token;

    const zoomClientApp = kintone.app.getRelatedRecordsTargetAppId("relatedZoomClient");
    const hostRole = 1;
    const attendRole = 0;
    const zoomapi = new zoomApi(token);
    const meetingType = 2;
    const loginUser = kintone.getLoginUser();

    let detailHandle = event => {
        kintone.app.record.setFieldShown('relatedZoomClient', false);
        let zoomApp = kintone.app.getId();
        let record = event.record;

        if (document.getElementById('join') !== null) {
            return;
        }
        
        let addZoomDom = zoomClientUrl => {
            if (document.getElementById('zoom') !== null) {
                document.getElementById('zoom').remove();
            }
            let zoomDiv = document.createElement("div");
            let zoom = `<div id="zoom"><iframe style="border:none; height: 600px; width: 100%;" src= ${zoomClientUrl} 
            sandbox="allow-forms allow-scripts allow-same-origin" allow="microphone; camera"></iframe></div>`;
            zoomDiv.innerHTML = zoom;
            kintone.app.record.getSpaceElement('zoom').appendChild(zoomDiv);
        }

        let updateHost = () => {
            let params = {
                "app": zoomApp,
                "id": kintone.app.record.getId(),
                "record": {
                    "host": {
                        "value": [
                            {
                                "code": loginUser.code
                            }
                        ]
                    }
                }
            };
            kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params).catch(error => {
                console.log(error);
            });
        }

        let checkTheHost = () => {
            let params = {
                "app": zoomApp,
                "id": kintone.app.record.getId()
            };
            return kintone.api(kintone.api.url('/k/v1/record', true), 'GET', params).then(resp => {
                let record = resp.record;
                return record["host"].value;
            }, error => {
                console.log(error);
            });
        }

        let updateRealAttend = () => {
            let params = {
                "app": zoomApp,
                "id": kintone.app.record.getId()
            };
            kintone.api(kintone.api.url('/k/v1/record', true), 'GET', params).then(resp => {
                let record = resp.record;
                let realAttends = record['realAttends'].value;
                for (let value of realAttends) {
                    if ("code" in value && value["code"] === loginUser.code) {
                        return;
                    }
                }

                let newAttend = {
                    "code": loginUser.code
                };
                realAttends.push(newAttend);
                let params = {
                    "app": zoomApp,
                    "id": kintone.app.record.getId(),
                    "record": {
                        "realAttends": {
                            "value": realAttends
                        }
                    }
                };
                kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params).catch(error => {
                    console.log(error);
                })
            }, error => {
                console.log(error);
            });
        }

        let zoom = {
            init: function () {
                this.addHost();
                this.addJoin();
            },
            addHost() {
                let hostButton = document.createElement('button');
                hostButton.id = 'host';
                hostButton.innerText = 'Host';
                hostButton.className = 'btn btn-primary';
                kintone.app.record.getSpaceElement('join').appendChild(hostButton);

                hostButton.onclick = () => {
                    updateHost();
                    updateRealAttend();
                    let meetingNumber = record.meetingNumber.value;
                    let password = record.password.value;
                    let zoomClientUrl = `/k/${zoomClientApp}/?meetingNumber=${meetingNumber}&password=${password}&role=${hostRole}`;
                    addZoomDom(zoomClientUrl);
                };
            },
            addJoin() {
                let joinButton = document.createElement('button');
                joinButton.id = 'attend';
                joinButton.innerText = 'Attend';
                joinButton.className = 'btn btn-info';
                joinButton.setAttribute('style', 'margin-left:10px;');
                kintone.app.record.getSpaceElement('join').appendChild(joinButton);

                joinButton.onclick = () => {
                    checkTheHost().then(resp => {
                        if (resp.length == 0) {
                            alert("Please waiting for the host");
                            return;
                        }
                        updateRealAttend();
                        let meetingNumber = record.meetingNumber.value;
                        let password = record.password.value;
                        let zoomClientUrl = `/k/${zoomClientApp}/?meetingNumber=${meetingNumber}&password=${password}&role=${attendRole}`;
                        addZoomDom(zoomClientUrl);
                    })
                };
            }
        }
        zoom.init();
    }
    kintone.events.on('app.record.detail.show', detailHandle);

    kintone.events.on('app.record.create.submit', async event => {
        let record = event.record;
        let data = {
            "topic": record.topic.value,
            "type": meetingType,
            "start_time": record.start_time.value,
            "duration": record.duration.value,
            "timezone": loginUser.timezone
        };
        let user = await zoomapi.getUsers();
        let userId = user.users[0]['id'];
        let meetingInfo = await zoomapi.createMeeting(userId, data);
        record['meetingNumber']['value'] = meetingInfo.id;
        record['join_url']['value'] = meetingInfo.join_url;
        record['password']['value'] = meetingInfo.encrypted_password;
        return event;
    });

    kintone.events.on(['app.record.create.show', 'app.record.index.edit.show', 'app.record.edit.show'], event => {
        let record = event.record;
        record['meetingNumber']['disabled'] = true;
        record['password']['disabled'] = true;
        record['join_url']['disabled'] = true;
        kintone.app.record.setFieldShown('realAttends', false);
        kintone.app.record.setFieldShown('host', false);
        return event;
    });

    kintone.events.on(['app.record.detail.delete.submit', 'app.record.index.delete.submit'], event => {
        let record = event.record;
        let meetingId = Number(record.meetingNumber.value);
        return zoomapi.deleteMeeting(meetingId);
    });
})(kintone.$PLUGIN_ID);

