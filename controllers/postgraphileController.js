const { postgraphile } = require("postgraphile");

const examplepgConfig = {
  user: "user",
  host: "hosturl",
  database: "db",
  password: "password",
  port: 4343,
};
const exampleurl = "postgres://user:password@hosturl:4555/db";
const PG_DB_LINK = process.env.PG_DB_LINK;

const postgraphileDB = postgraphile(PG_DB_LINK, "public", {
  graphqlRoute: "/",
  graphiqlRoute: "/graphiql",
  watchPg: true,
  graphiql: true,
  enhanceGraphiql: true,
});

module.exports = { postgraphileDB };
