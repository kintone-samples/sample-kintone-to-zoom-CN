import {Label, Text, Button} from '@kintone/kintone-ui-component/esm/js';

((PLUGIN_ID) => {
  const apiUrl = 'https://api.zoom.us/v2';
  const headerInfo = kintone.plugin.app.getProxyConfig(apiUrl, 'POST');
  let zoomToken = '';
  if (headerInfo) {
    const {groups: {token}} = /Bearer (?<token>[^ $]*)/.exec(headerInfo.headers.Authorization);
    zoomToken = token;
  }

  const tokenDiv = document.getElementById('token');
  const tokenText = new Text({
    placeholder: 'token',
    value: zoomToken
  });
  tokenDiv.appendChild(new Label({text: 'Token', isRequired: true}).render());
  tokenDiv.appendChild(tokenText.render());

  const saveButton = new Button({text: 'Save', type: 'submit'});
  document.getElementById('save_button').appendChild(saveButton.render());
  saveButton.on('click', () => {
    const token = tokenText.getValue();
    const pluginHeader = {
      'Authorization': `Bearer ${token}`
    };
    kintone.plugin.app.setProxyConfig(apiUrl, 'GET', pluginHeader, {}, () => {
      kintone.plugin.app.setProxyConfig(apiUrl, 'POST', pluginHeader, {}, () => {
        kintone.plugin.app.setProxyConfig(apiUrl, 'DELETE', pluginHeader, {});
      });
    });
  });
})(kintone.$PLUGIN_ID);
