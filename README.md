## Problem Statement

Create e a simple application that allows the user to complete/solve programming tests/problems just like LeetCode or Hackerrank.

### Requirements

- [Nodejs](https://nodejs.org/en/) is a JavaScript runtime built on Chrome's V8 JavaScript engine.
- [Nestjs](https://nestjs.com/) is a framework for building efficient, scalable Node.js server-side applications. It uses progressive JavaScript, is built with and fully supports TypeScript. Under the hood, Nest makes use of robust HTTP Server frameworks like Express (the default) and optionally can be configured to use Fastify as well!
- [Docker](https://www.docker.com/) is a platform designed to help developers build, share, and run container applications.
- [Docker compose](https://docs.docker.com/compose/) is a tool for defining and running multi-container applications. It simplifies the control of your entire application stack, making it easy to manage services, networks, and volumes in a single, comprehensible YAML configuration file. Then, with a single command, you create and start all the services from your configuration file.

## How to Setup Locally

- Ensure you have node, docker and docker compose installed
- Clone the repository using `git clone https://github.com/alahirajeffrey/tvzcorp-technical-test.git`
- Navigate to the cloned repo and install the dependencies using `npm install`
- Run the command `docker compose up -d` to run mysql and redis in a detached mode.
- Run the database migrations using the command `npx prisma migrate dev`
- Create a .env file and use the variavles in the .env.example file as a guide to populate the .env file
- To run the API sever in development mode using nodemon, use `npm run start:dev`
- To run in production using, use `npm run start:prod`
- Once the application is running, navigate to `localhost:3000/api/v1/doc` to access the swagger file and test the enpoints

## How to Use

- Once the server has been setup, upload a profile picture using the `/upload/profile-picture` endpoint and pass the url into the request body of the `/auth/register` endpoint to create a new account.
- **NB** You have to register as a DEVELOPER in order to make submissions. Recruiters can register as RECRUITER.
- You can then login to your acount in order to solve problems.
- On the swagger page, navigate to the problems section to see the problems available, create and update problems.
- **NB** Only admins can create and update problems
- In order to solve a problem, you can navigate to the submissions section.
- The available languages to solve a problem can be found [here](https://ce.judge0.com/languages/).
- Simply copy the laguage ID of the language you want to use and pass into the request body. You can also pass your submission as a text.

# Author

[Alahira Jeffrey](<(https://github.com/alahirajeffrey)>)

# Lincense

This project is available for use under the MIT License.

## Todo

- fix pagination
- update status field in database schema
