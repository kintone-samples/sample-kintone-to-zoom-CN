import {Label, Text, Button} from '@kintone/kintone-ui-component/esm/js';

((PLUGIN_ID) => {
  let pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!pluginConfig) {
    pluginConfig = {};
  }

  const apiKeyDiv = document.getElementById('api_key');
  const apiKeyText = new Text({
    placeholder: 'api key',
    value: 'api_key' in pluginConfig ? pluginConfig.api_key : ''
  });
  apiKeyDiv.appendChild(new Label({text: 'API_KEY', isRequired: true}).render());
  apiKeyDiv.appendChild(apiKeyText.render());

  const apiSerectDiv = document.getElementById('api_secret');
  const apiSerectText = new Text({
    placeholder: 'api serect',
    value: 'api_secret' in pluginConfig ? pluginConfig.api_secret : ''
  });
  apiSerectDiv.appendChild(new Label({text: 'API_SECRET', isRequired: true}).render());
  apiSerectDiv.appendChild(apiSerectText.render());

  const saveButton = new Button({text: 'Save', type: 'submit'});
  document.getElementById('save_button').appendChild(saveButton.render());
  saveButton.on('click', () => {
    const submitConfig = {
      'api_key': apiKeyText.getValue(),
      'api_secret': apiSerectText.getValue()
    };
    kintone.plugin.app.setConfig(submitConfig);
  });
})(kintone.$PLUGIN_ID);
