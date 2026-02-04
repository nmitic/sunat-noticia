require('dotenv').config();

module.exports = {
  datasource: {
    url: process.env.POSTGRES_URL,
  },
};
