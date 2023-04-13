'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const noteModel = require('./notes/model.js')
const userModel = require('./users/users.js')
const Collection = require('./data-collections.js');

const DATABASE_URL = process.env.DATABASE_URL || 'sqlite:memory:';

const sequelize = new Sequelize(DATABASE_URL);

// const user = userModel(sequelize, DataTypes);

const note = noteModel(sequelize, DataTypes);

module.exports = {
  db: sequelize,
  // users: new Collection(user),
  users: userModel(sequelize, DataTypes),
  note: new Collection(note)
};
