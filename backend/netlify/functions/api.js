const serverless = require("serverless-http");

const { app, initialize } = require("../../app");

const proxy = serverless(app);

exports.handler = async function handler(event, context) {
    await initialize();

    return proxy(event, context);
};