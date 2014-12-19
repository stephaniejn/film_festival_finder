"use strict";

module.exports = function(sequelize, DataTypes) {
  var favorite = sequelize.define("favorite", {
    name: DataTypes.STRING,
    country: DataTypes.STRING,
    fee: DataTypes.STRING,
    lastDeadline: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    logoUrl: DataTypes.STRING

  }, {
    classMethods: {
      associate: function(models) {
        models.favorite.belongsTo(models.user)
        models.favorite.hasMany(models.comment)
        // associations can be defined here
      }
    }
  });

  return favorite;
};
