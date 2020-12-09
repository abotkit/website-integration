FROM node:alpine3.10

COPY package.json /opt/clementine/package.json
WORKDIR /opt/clementine

RUN npm install

COPY . /opt/clementine/

ENV ABOTKIT_CLEMENTINE_PORT=3030
ENV ABOTKIT_MAEVE_URL=http://localhost
ENV ABOTKIT_MAEVE_PORT=3000
ENV ABOTKIT_CLEMENTINE_LOG_LEVEL=info

EXPOSE 3030

ENTRYPOINT ["node", "index.js"]