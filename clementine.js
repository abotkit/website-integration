import React from 'react';
import express from 'express';
import { env } from 'process';
import ReactDOMServer from 'react-dom/server';
import cors from 'cors';
import axios from 'axios';
import bunyan from 'bunyan';
import Settings from './Settings';
import level from 'level';
import ip from 'ip';
import { injectOnChange } from './helper';
const db = level('./db', { valueEncoding: 'json' });

const app = express();
app.use(express.json());
app.use(cors());

const logger = bunyan.createLogger({name: 'clementine'});
logger.level(env.ABOTKIT_CLEMENTINE_LOG_LEVEL || 'info');
const port = env.ABOTKIT_CLEMENTINE_PORT || 3030;

const revokeUrlWhitelisting = async (url) => {

}

const whitelistUrl = async (url) => {

}

const generateHtmlIntegrationLink = async (bot, uuid) => {
  return 'https://abotkit.io/integration/website-integration?bot=' + bot;
}

app.get('/', (req, res) => {
  res.status(200).send('"You\'re new. Not much of a rind on you, I\'ll give you a discount." - Clementine Pennyfeather');
});

app.get('/alive', (req, res) => {
  res.status(200).end();
});

app.get('/settings', (req, res) => {
  let htmlString = ReactDOMServer.renderToString(<Settings />);
  htmlString = injectOnChange('whitelistUrl', htmlString, () => console.log('hi'));
  res.json(htmlString);
})

app.post('/settings', async (req, res) => {
  if (typeof req.body.settings !== 'undefined') {
    try {
      await db.put('settings', req.body.settings);
      res.status(200).end();
    } catch (error) {
      logger.error(error);
      res.status(500).json(error);
    }
  } else {
    res.status(200).end();
  }
});

app.post('/execute', (req, res) => {
  res.status(200).end();

  db.get('settings', async (error, value) => {
    if (error) {
      return res.status(500).json(error);
    } else {
      const link = await generateHtmlIntegrationLink(newIntegration.bot, newIntegration.uuid);
      res.status(200).end();
    }
  });
});

app.listen(port, async () => {
  logger.info(`"I'm listening on port ${port}!`);

  const maeveUrl = env.ABOTKIT_MAEVE_URL || 'http://localhost';
  const maevePort = env.ABOTKIT_MAEVE_PORT || 3000;

  try {
    await axios.post(`${maeveUrl}:${maevePort}/integration`, {
      name: 'Website Integration',
      secret: 'API-SECRET',
      url: `http://${ip.address()}:${port}`
    });

    logger.info('Integration successfully registered');
  } catch (error) {
    if (error.response && error.response.status === 303) {
      logger.info('I\'m already registered');
    } else {
      logger.error('Integration registration failed. Check maeve url or secret.');
      logger.error(error);
    }
  }
});