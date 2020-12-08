const express = require("express");
const app = express();
const { env } = require('process');

const cors = require("cors");
app.use(express.json());
app.use(cors());

const axios = require("axios").default;

const bunyan = require('bunyan');
const logger = bunyan.createLogger({name: 'clementine'});

logger.level(env.ABOTKIT_CLEMENTINE_LOG_LEVEL || 'info');

const port = env.ABOTKIT_MAEVE_PORT || 3030;

app.get('/', (req, res) => {
  res.status(200).send('"You\'re new. Not much of a rind on you, I\'ll give you a discount." - Clementine Pennyfeather');
});

app.get('/alive', (req, res) => {
  res.status(200).end();
});

app.listen(port, async () => {
  logger.info(`"I'm listening on port ${port}!`);
});