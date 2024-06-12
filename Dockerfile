FROM node

WORKDIR /usr/tvzcorp

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD [ "node", "run", "start:prod" ]