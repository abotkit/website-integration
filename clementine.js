const express = require('express');
const { env, title, send } = require('process');
const cors = require('cors');
const axios = require('axios');
const bunyan = require('bunyan');
const ip = require('ip');
const level = require('level');
const { Input, message } = require('antd');
const db = level('./db', { valueEncoding: 'json' });

const app = express();
app.use(express.json());
app.use(cors());

const logger = bunyan.createLogger({name: 'clementine'});
logger.level(env.ABOTKIT_CLEMENTINE_LOG_LEVEL || 'info');
const port = env.ABOTKIT_CLEMENTINE_PORT || 3035;

const maeveUrl = env.ABOTKIT_MAEVE_URL || 'http://localhost:3000';

app.get('/', (req, res) => {
  res.status(200).send('"You\'re new. Not much of a rind on you, I\'ll give you a discount." - Clementine Pennyfeather');
});

app.get('/alive', (req, res) => {
  res.status(200).end();
});

const generateHtmlIntegrationLink = bot => {
  return `<script type="text/javascript" src="${maeveUrl}/integration/Website%20Integration/resource?bot=${bot}"></script>`;
}

/*
  This settings config will be requested by maeve and delivered to dolores and then rendered into input fields
  and allows the user to enter some settings
*/
app.get('/settings', (req, res) => {
  db.get('whitelist', (error, value) => {
    console.log(value)
    if (error) {
      logger.error(error);
      return res.status(500).json(error);
    } else {
      const settings = [{
        type: 'input',
        placeholder: {
          de: 'Script Element',
          en: 'Script Element'
        },
        attributes: ['readonly', 'copyable'],
        value: generateHtmlIntegrationLink(req.query.bot)
      }, {
        type: 'dynamic-list',
        name: 'whitelist',
        headline: {
          de: 'Erlaubte Urls',
          en: 'Whitelisted Urls'
        },
        placeholder: {
          de: 'Eine neue Url',
          en: 'A new Url'
        },
        entries: value
      }, {
        type: 'button',
        id: 'submit-settings',
        action: 'submit',
        text: {
          de: 'Übernehmen',
          en: 'Apply'
        },
        postActionSnackbar: {
          de: 'Deine Einstellungen wurden erfolgreich gespeichert', 
          en: 'Successfully stored your preferences'
        }
      }];
      res.json(settings);
    }
  });
})

app.post('/settings', async (req, res) => {
  if (typeof req.body.data !== 'undefined') {
    try {
      console.log(req.body.data)
      await db.put('whitelist', req.body.data.whitelist || []);
      res.status(200).end();
    } catch (error) {
      logger.error(error);
      res.status(500).json(error);
    }
  } else {
    res.status(200).end();
  }
});

/*
  Use this endpoint to return a static resource
*/
app.get('/resource', (req, res) => {
  function injectChatbot(abotkitUrl, bot) {
    var sheet = document.createElement('style')
    sheet.innerHTML = `
      .abotkit-chat-root {
        position: fixed;
        bottom: 12px;
        right: 12px;
      }

      .abotkit-chat-fab { 
        background-color: #00838F;
        width: 60px;
        height: 60px;
        border-radius: 100%;
        background: #00838F;
        border: none;
        outline: none;
        color: #FFF;
        font-size: 36px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .abotkit-chat-window {
        display: flex;
        flex-direction: column;
        align-items: stretch; 
        width: 50vw;
        height: 75vh;
      }
      
      .abotkit-chat-window-title {
        height: 32px;
        background-color: #00838F;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }

      .abotkit-chat-window-title > span {
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
      }

      .abotkit-chat-window-title > span > svg {
        padding-right: 12px;
      }

      .abotkit-chat-window-input {
        display: flex;
        border: 1px solid #ccc;
      }

      .abotkit-chat-window-input > input {
        flex-grow: 1;
        padding: 6px;
        outline: 0;
        border: 0;
      }

      .abotkit-chat-window-input > span {
        background: white;
        padding: 6px;
      }

      .abotkit-chat-messages {
        color: white;
        display: flex;
        flex-grow: 1;
        background-color: white;
        overflow-y: scroll;
        flex-direction: column;
      }

      .abotkit-chat-message {
        width: fit-content;
        margin: 12px;
        display: flex;
        padding: 6px 12px;
        position: relative;
        border-radius: 6px;
        flex-direction: column;
      }

      .abotkit-human-chat-message {
        background: #0097A7;
        border-top-left-radius: 0;
      }

      .abotkit-bot-chat-message {
        align-self: flex-end;
        background: #00838F;
        border-top-right-radius: 0;
      }
    `;
    
    var chatIdentifier = new Array(16).join().replace(/(.|$)/g, function(){return ((Math.random()*36)|0).toString(36);});
    var root = document.createElement('div');
    root.classList.add('abotkit-chat-root');

    var button = document.createElement('div');
    button.classList.add('abotkit-chat-fab');
    button.innerHTML = '<svg viewBox="64 64 896 896" focusable="false" data-icon="message" width="0.8em" height="0.8em" fill="currentColor" aria-hidden="true"><path d="M464 512a48 48 0 1096 0 48 48 0 10-96 0zm200 0a48 48 0 1096 0 48 48 0 10-96 0zm-400 0a48 48 0 1096 0 48 48 0 10-96 0zm661.2-173.6c-22.6-53.7-55-101.9-96.3-143.3a444.35 444.35 0 00-143.3-96.3C630.6 75.7 572.2 64 512 64h-2c-60.6.3-119.3 12.3-174.5 35.9a445.35 445.35 0 00-142 96.5c-40.9 41.3-73 89.3-95.2 142.8-23 55.4-34.6 114.3-34.3 174.9A449.4 449.4 0 00112 714v152a46 46 0 0046 46h152.1A449.4 449.4 0 00510 960h2.1c59.9 0 118-11.6 172.7-34.3a444.48 444.48 0 00142.8-95.2c41.3-40.9 73.8-88.7 96.5-142 23.6-55.2 35.6-113.9 35.9-174.5.3-60.9-11.5-120-34.8-175.6zm-151.1 438C704 845.8 611 884 512 884h-1.7c-60.3-.3-120.2-15.3-173.1-43.5l-8.4-4.5H188V695.2l-4.5-8.4C155.3 633.9 140.3 574 140 513.7c-.4-99.7 37.7-193.3 107.6-263.8 69.8-70.5 163.1-109.5 262.8-109.9h1.7c50 0 98.5 9.7 144.2 28.9 44.6 18.7 84.6 45.6 119 80 34.3 34.3 61.3 74.4 80 119 19.4 46.2 29.1 95.2 28.9 145.8-.6 99.6-39.7 192.9-110.1 262.7z"></path></svg>';
    button.style.display = 'flex';

    var chat = document.createElement('div');
    chat.classList.add('abotkit-chat-window');

    var toggleChat = function (show) {
      if (show) {
        chat.style.display = 'flex';
        button.style.display = 'none';
      } else {
        chat.style.display = 'none';
        button.style.display = 'flex';
      }
    }

    title = document.createElement('div');
    title.classList.add('abotkit-chat-window-title');
    closeIcon = document.createElement('span');
    closeIcon.innerHTML = '<svg viewBox="64 64 896 896" focusable="false" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path></svg>';
    closeIcon.onclick = function() {
      toggleChat(false);
    }
    title.appendChild(closeIcon);
    
    chatHistory = document.createElement('div');
    chatHistory.classList.add('abotkit-chat-messages');

    var messages = [];
    var renderMessages = function() {
      chatHistory.innerHTML = '';
      for (var message of messages) {
        var speechBubble = document.createElement('div');
        speechBubble.innerHTML = message.text;
        speechBubble.classList.add('abotkit-chat-message');
        if (message.issuer === 'bot') {
          speechBubble.classList.add('abotkit-bot-chat-message');
        } else {
          speechBubble.classList.add('abotkit-human-chat-message');
        }
        chatHistory.appendChild(speechBubble);
      }
    }

    chatInput = document.createElement('div');
    chatInput.classList.add('abotkit-chat-window-input');

    inputField = document.createElement('input');
    inputField.type = 'text';
    
    submitButton = document.createElement('span');
    submitButton.innerHTML = '<svg viewBox="64 64 896 896" focusable="false" data-icon="send" width="1em" height="1em" fill="currentColor" aria-hidden="true"><defs><style></style></defs><path d="M931.4 498.9L94.9 79.5c-3.4-1.7-7.3-2.1-11-1.2a15.99 15.99 0 00-11.7 19.3l86.2 352.2c1.3 5.3 5.2 9.6 10.4 11.3l147.7 50.7-147.6 50.7c-5.2 1.8-9.1 6-10.3 11.3L72.2 926.5c-.9 3.7-.5 7.6 1.2 10.9 3.9 7.9 13.5 11.1 21.5 7.2l836.5-417c3.1-1.5 5.6-4.1 7.2-7.1 3.9-8 .7-17.6-7.2-21.6zM170.8 826.3l50.3-205.6 295.2-101.3c2.3-.8 4.2-2.6 5-5 1.4-4.2-.8-8.7-5-10.2L221.1 403 171 198.2l628 314.9-628.2 313.2z"></path></svg>';
    submitButton.onclick = function () {
      messages.push({issuer: 'user', text: inputField.value});
      renderMessages();
      var query = inputField.value;
      inputField.value = '';
      fetch(`${abotkitUrl}/handle`, {
        method: "POST",
        body: JSON.stringify({
          bot: bot,
          query: query,
          identifier: chatIdentifier
        }),
        headers: {"Content-type": "application/json; charset=UTF-8"}
      })
      .then(response => response.json())
      .then(data => {
        messages.push({issuer: 'bot', text: data[0].text});
        renderMessages();
      });
    };

    inputField.addEventListener("keyup", function(event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        submitButton.click();
      }
    });

    chatInput.appendChild(inputField);
    chatInput.appendChild(submitButton);

    chat.appendChild(title);
    chat.appendChild(chatHistory);
    chat.appendChild(chatInput);

    chat.style.display = 'none';

    button.onclick = function() {
      toggleChat(true)
    }

    root.appendChild(sheet)
    root.appendChild(button);
    root.appendChild(chat);

    if (document.body == null) {
      window.addEventListener('load', function () {
        document.body.appendChild(root);
      });
    } else {
      document.body.appendChild(root);
    }
  }
  res.setHeader("Content-Type", "text/javascript");
  res.status(200).send(`${injectChatbot.toString()} injectChatbot('${maeveUrl}', '${req.query.bot}');`);
});

app.listen(port, async () => {
  logger.info(`"I'm listening on port ${port}!`);

  try {
    await axios.post(`${maeveUrl}/integration`, {
      name: 'Website Integration',
      secret: 'API-SECRET',
      url: `http://${ip.address()}:${port}`
    });

    logger.info('Integration successfully registered');
  } catch (error) {
    if (error.response && error.response.status === 303) {
      logger.info('I\'m already registered');
    } else {
      logger.error(error);
      logger.warn('Integration registration failed. Check maeve url or secret.');
    }
  }

  try {
    await db.get('whitelist');
  } catch (error) {
    if (error.type === 'NotFoundError') {
      logger.info('whitelist does not exist. Add empty list as value instead.')
      await db.put('whitelist', []);
    } else {
      logger.error(error);
    }
  }
});