const Router = (module.exports = require("express").Router());

Router.use("/v1", require("./user"));
Router.use("/v1", require("./task"));
