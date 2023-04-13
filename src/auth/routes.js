'use strict';

const express = require('express');
const authRouter = express.Router();

const { users } = require('./../models/');
const basicAuth = require('./middleware/basic.js')
const bearerAuth = require('./middleware/bearer.js')
const permissions = require('./middleware/acl.js')

authRouter.post('/signup', async (req, res, next) => {
  try {
    let userRecord = await users.create(req.body);
    
    const output = {
      user: userRecord,
      token: userRecord.token
    };
    console.log(output)
    res.status(201).json(output);
  } catch (e) {
    console.error(e)
  }
});

authRouter.post('/signin', basicAuth, (req, res, next) => {
  try{
  // console.log('hi')
  const user = {
    user: req.user,
    token: req.user.token
  };
  
  res.status(200).json(user);
}
catch(e){
  console.error(e)
}
});

authRouter.get('/users', bearerAuth, permissions('delete'), async (req, res, next) => {
  try{
      const userRecords = await users.findAll({});
  const list = userRecords.map(user => user.username);
  res.status(200).json(list);
  }catch(e){
    console.error(e)
  }

});

authRouter.get('/secret', bearerAuth, async (req, res, next) => {
  res.status(200).send('Welcome to the secret area')
});

module.exports = authRouter;
