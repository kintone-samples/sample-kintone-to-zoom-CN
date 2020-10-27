import { Label, Text, Button } from '@kintone/kintone-ui-component/esm/js';

((PLUGIN_ID) => {
  let headerInfo = kintone.plugin.app.getProxyConfig('https://api.zoom.us/v2', 'POST');
  let zoomToken = '';
  if (headerInfo) {
    const { groups: { token } } = /Bearer (?<token>[^ $]*)/.exec(headerInfo.headers['Authorization']);
    zoomToken = token;
  }

  const tokenDiv = document.getElementById('token');
  const tokenText = new Text({
    placeholder: 'token',
    value: zoomToken
  });
  tokenDiv.appendChild(new Label({ text: 'Token', isRequired: true }).render());
  tokenDiv.appendChild(tokenText.render());

  const saveButton = new Button({ text: 'Save', type: 'submit' });
  document.getElementById('save_button').appendChild(saveButton.render());
  saveButton.on('click', () => {
    const token = tokenText.getValue();
    const pluginHeader = {
      'Authorization': `Bearer ${token}`
    };
    kintone.plugin.app.setProxyConfig('https://api.zoom.us/v2', 'POST', pluginHeader, {});
    kintone.plugin.app.setProxyConfig('https://api.zoom.us/v2', 'GET', pluginHeader, {});
  });
})(kintone.$PLUGIN_ID);
