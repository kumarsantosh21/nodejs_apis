const mysql = require("mysql");
const db = require("../config/db");

const encrpytKey = process.env.COLUMN_ENCRYPT_KEY;

const chartData = async (req, res) => {
  const { statement } = req.body;

  // let sql = `select pgp_sym_decrypt(shop::bytea,$1) from connectdetails where email_id=$2`;
  let sql = `select shop from connectdetails where email_id=$1`;

  try {
    const response = await db.query(sql, [req?.user?.useremail]);
    const result = response?.rows[o]?.shop;

    let chartResult;
    // Create a MySQL connection
    const connection = mysql.createConnection({
      user: process.env.MYSQL_DATABASE_USER,
      password: process.env.MYSQL_PASSWORD,
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_HOSTED_DB_PORT,
      database: result,
    });

    connection.query(sqlQuery, (err, queryres) => {
      console.log({ res });
      console.log({ err });
      if (err) {
        return res.json({
          error: "token validation successful , Failed while quering ",
          errorbody: err,
        });
      }

      return res.json({ data: queryres });
    });

    // Connect to MySQL server
    // connection.connect((err) => {
    //   if (err) {
    //     console.error("Error connecting to MySQL server: " + err.stack);
    //     return;
    //   }
    //   console.log("Connected to MySQL server as id " + connection.threadId);

    //   // Perform queries or other database operations

    //   chartResult = connection.query(statement);
    //   console.log(chartResult);

    //   // Close the MySQL connection
    //   connection.end((err) => {
    //     if (err) {
    //       console.error("Error closing MySQL connection: " + err.stack);
    //       return;
    //     }
    //     console.log("MySQL connection closed");
    //   });
    // });

    // return res.json({ data: chartResult });
  } catch (err) {
    console.log({ err });
    return res.json({
      error: "token validation successful , Failed while quering ",
      errorbody: err,
    });
  }
};

module.exports = { chartData };
