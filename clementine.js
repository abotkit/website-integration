const express = require('express');
const { env } = require('process');
const cors = require('cors');
const axios = require('axios');
const bunyan = require('bunyan');
const ip = require('ip');
const level = require('level');
const db = level('./db', { valueEncoding: 'json' });

const app = express();
app.use(express.json());
app.use(cors());

const logger = bunyan.createLogger({name: 'clementine'});
logger.level(env.ABOTKIT_CLEMENTINE_LOG_LEVEL || 'info');
const port = env.ABOTKIT_CLEMENTINE_PORT || 3030;

app.get('/', (req, res) => {
  res.status(200).send('"You\'re new. Not much of a rind on you, I\'ll give you a discount." - Clementine Pennyfeather');
});

app.get('/alive', (req, res) => {
  res.status(200).end();
});

/*
  This settings config will be requested by maeve and delivered to dolores and then rendered into input fields
  and allows the user to enter some settings
*/
app.get('/settings', (req, res) => {
  const settings = [{
    type: 'input',
    placeholder: {
      de: 'Benutzername',
      en: 'Username'
    },
    name: 'username'
  }, {
    type: 'input',
    placeholder: {
      de: 'Passwort',
      en: 'Password'
    },
    name: 'password'
  }, {
    type: 'button',
    id: 'submit-settings',
    action: 'submit',
    text: {
      de: 'Absenden',
      en: 'Submit'
    },
    postActionSnackbar: {
      de: 'Deine Einstellungen wurden erfolgreich gespeichert', 
      en: 'Successfully stored your preferences'
    }
  }, {
    type: 'button',
    id: 'hello-client',
    action: (() => alert("hello")).toString(),
    text: {
      de: 'Hallo',
      en: 'Hello'
    }
  }, {
    type: 'button',
    id: 'hello-server',
    action: 'execute',
    postAction: (response => {
      alert(response.data);
    }).toString(),
    text: {
      de: 'Hallo Server',
      en: 'Hello Server'
    }
  }];

  res.json(settings);
})

/*
  Dolores will ask maeve to call this endpoint 
  after submission of your settings form (e.g. Settings.jsx)
  
  req.body.settings could be any json object like:

  "settings": {
      "name": "fancy name",
      "password": "fancy password"
  }
*/
app.post('/settings', async (req, res) => {
  if (typeof req.body.data !== 'undefined') {
    try {
      await db.put('settings', req.body.data);
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
  You can add custom code if anyone needs to communicate with your integration via maeve
*/
app.post('/execute', (req, res) => {
  db.get('settings', (error, value) => {
    if (error) {
      logger.error(error);
      return res.status(500).json(error);
    } else {
      logger.info(value);

      if (typeof value.username === 'undefined') {
        res.status(200).send('hello');
      } else {
        res.status(200).send(`hello ${value.username}`);
      }
    }
  });
});

app.listen(port, async () => {
  logger.info(`"I'm listening on port ${port}!`);

  const maeveUrl = env.ABOTKIT_MAEVE_URL || 'http://localhost';
  const maevePort = env.ABOTKIT_MAEVE_PORT || 3000;

  try {
    /*
      You need to register your integration for a specified bot therefore a maeve instance url and port is needed
      Maeve will register this integration for all bots, if bot is not specified
    */
    await axios.post(`${maeveUrl}:${maevePort}/integration`, {
      name: 'Any Integration',
      secret: 'API-SECRET',
      url: `http://${ip.address()}:${port}`
    });

    logger.info('Integration successfully registered');
  } catch (error) {
    logger.error(error);
    logger.warn('Integration registration failed. Check maeve url or secret.');
  }

  try {
    const settings = await db.get('settings');
    console.log(settings);
  } catch (error) {
    if (error.type === 'NotFoundError') {
      logger.info('settings does not exist. Add empty object as value instead.')
      await db.put('settings', {});
    } else {
      logger.error(error);
    }
  }


  /*
    Remove this section if your integration does not need to perform a background task
  */
  const backgroundTaskIntervalDelay = 10000;
  setInterval(() => { 
    logger.info('Perform background task like fetching or polling.')
  }, backgroundTaskIntervalDelay); 

});