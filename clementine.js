import React from 'react';
import express from 'express';
import { env } from 'process';
import ReactDOMServer from 'react-dom/server';
import cors from 'cors';
import axios from 'axios';
import bunyan from 'bunyan';
import Settings from './Settings';

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
  This settings component will be requested by maeve and delivered to dolores 
  and allows the user to enter some settings
*/
app.get('/settings', (req, res) => {
  res.json(ReactDOMServer.renderToString(<Settings />));
})

app.listen(port, async () => {
  logger.info(`"I'm listening on port ${port}!`);

  const maeveUrl = env.ABOTKIT_MAEVE_URL || 'http://localhost';
  const maevePort = env.ABOTKIT_MAEVE_PORT || 3000;

  try {
    /*
      You need to register your integration for a specified bot therefore a maeve instance url and port is needed
      -> maeve will extract the clementine url and port from req.headers.host

      Maeve will register this integration for all bots, if bot is not specified
    */
    await axios.post(`${maeveUrl}:${maevePort}/register/integration`, {
      name: 'My integration',
      secret: 'API-SECRET',
      bot: 'robert'
    });

    logger.info('Integration successfully registered');
  } catch {
    logger.warn('Integration registration failed. Check maeve url or secret.');
  }

  /*
    Remove this section if your integration does not need to perform a background task
  */
  const backgroundTaskIntervalDelay = 5000;
  setInterval(() => { 
    logger.info('Perform background task like fetching or polling.')
  }, backgroundTaskIntervalDelay); 

});