"use strict";

var bcrypt = require('bcrypt');

module.exports = function(sequelize, DataTypes) {
  var user = sequelize.define("user", {
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: {
          args:true,
          msg: 'Please enter a valid email address.'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        len:{
          args: [5,100],
          msg: "Please create a password over 5 characters long"
        }
      }
    },
    name:{
      type: DataTypes.STRING,
      validate: {
        len:{
          args: [1,100],
          msg: "Please enter a name"
        }
      }
    }
  }, {
    classMethods: {
      associate: function(models) {
        models.user.hasMany(models.favorite)
        // associations can be defined here
      }
    },
    hooks: {
      beforeCreate: function(data, garbage, sendback){
        var pwdToEncrypt = data.password;
        bcrypt.hash(pwdToEncrypt, 10, function (err, hash){
          data.password = hash;
          sendback(null, data);
        })
      }
    }
  });

  return user;
};
