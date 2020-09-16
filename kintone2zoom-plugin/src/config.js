import { Label, Text, Button } from '@kintone/kintone-ui-component/esm/js';

((PLUGIN_ID) => {
    const pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!pluginConfig) {
        pluginConfig = {};
    }

    const tokenDiv = document.getElementById('token');
    let tokenText = new Text({
        placeholder: 'token',
        value: 'token' in pluginConfig ? pluginConfig['token'] : ''
    });
    tokenDiv.appendChild(new Label({ text: 'Token', isRequired: true }).render());
    tokenDiv.appendChild(tokenText.render());

    const saveButton = new Button({ text: 'Save', type: 'submit' });
    document.getElementById('save_button').appendChild(saveButton.render());
    saveButton.on('click', () => {
        let submitConfig = {
            'token': tokenText.getValue()
        };
        kintone.plugin.app.setConfig(submitConfig);
    });
})(kintone.$PLUGIN_ID);