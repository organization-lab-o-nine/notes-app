'use strict';

const noteModel = (sequelize, DataTypes) => sequelize.define('Notes', {
  title: { type: DataTypes.STRING, required: true },
  subtitle: { type: DataTypes.STRING },
  content: { type: DataTypes.STRING, required: true }
});

module.exports = noteModel;
