FROM node

WORKDIR /usr/tvzcorp

COPY package*.json ./

RUN npm install

COPY . .

## run migrations after copying files
RUN npm run migrate:dev

RUN npm run build

# Expose  application port
EXPOSE 3000

CMD [ "node", "run", "start:prod"]