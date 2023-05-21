const express = require('express');
const app = express.Router();
const { Task } = require('../db');

module.exports = app;

app.get('/', async (req, res, next) => {
  try {
    res.send(await Task.findAll());
  } catch (error) {
    next(error);
  }
});
