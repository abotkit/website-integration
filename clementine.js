const express = require('express');
const { env } = require('process');
const cors = require('cors');
const axios = require('axios');
const bunyan = require('bunyan');
const ip = require('ip');
const level = require('level');
const { Input } = require('antd');
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

  function addDiv() {
    var div = document.createElement('div');
    div.style.height = '40vh';
    div.style.width = '25vw';
    div.style.position = 'fixed';
    div.style.bottom = '12px';
    div.style.right = '12px';
    div.style.backgroundColor = 'rgba(0,0,0,0.625)';
    document.body.appendChild(div);
  }
  res.setHeader("Content-Type", "text/javascript");
  res.status(200).send(`${addDiv.toString()} addDiv();`);
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