const { Pool } = require("pg");
const format = require("pg-format");

const dbName = process.env.DATABASE;

// Create a new pool instance with your database connection details
const pool = new Pool({
  user: process.env.PG_DATABASE_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_HOSTED_DB_PORT,
  connectionTimeoutMillis: 10000,
});

const epool = new Pool({
  user: process.env.PG_DATABASE_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  database: process.env.DATABASE,
  port: process.env.PG_HOSTED_DB_PORT,
  connectionTimeoutMillis: 10000,
});

async function dbSetup() {
  const client = await pool.connect();
  try {
    const checkDB = "SELECT * FROM pg_database WHERE datname = ($1)";
    const checkDBres = await client.query(checkDB, [dbName]);
    if (checkDBres.rowCount > 0) {
      console.log(`${dbName} db already exist`);
      await epool.query("SELECT * FROM pg_database", (err, res) => {
        console.log({ res }, { err });
        if (err) {
          throw err;
        }
      });
    } else {
      const createDB = format("CREATE DATABASE %I;", dbName);
      const checkCreateDBres = await client.query(createDB);
      console.log(`${dbName} db created`);

      await client.query("BEGIN");

      const createUserdetailsTable = `CREATE TABLE userdetails (
    id SERIAL NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    email_id VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_email_confirmed boolean NOT NULL,
    recent_passwords VARCHAR(255)[] NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(255) NOT NULL,
    role_in_company VARCHAR(255) NOT NULL,
    previous_experience VARCHAR(255) NOT NULL,
    plan_to_use_data VARCHAR(255) NOT NULL,
    first_time boolean NOT NULL,
    connected boolean NOT NULL,
    logo_url VARCHAR(255) NOT NULL,
    primary key(email_id)
  );`;

      const createTableres = await epool.query(createUserdetailsTable);
      console.log("userdetails table created");

      const createSourcesTable = `CREATE TABLE sources (
	id SERIAL NOT NULL UNIQUE,
	email_id VARCHAR(255) NOT NULL,
	source_type VARCHAR(255) NOT NULL,
	progress INT NOT NULL,
	sync_status VARCHAR(255) NOT null,
	primary key(email_id,source_type),
	CONSTRAINT fk_email_id 
FOREIGN KEY(email_id)   
REFERENCES userdetails(email_id)  
);`;

      const createSourcesTableres = await epool.query(createSourcesTable);
      console.log("sources table created");

      const createConnectDetails = `CREATE TABLE connectdetails (
	id SERIAL NOT NULL,
	email_id VARCHAR(255) NOT NULL,
	shop VARCHAR(255) NOT NULL,
	api VARCHAR(255) NOT NULL,
	token VARCHAR(255) NOT NULL,
	fromdate VARCHAR(255) NOT null,
	CONSTRAINT fk_email_id 
FOREIGN KEY(email_id)   
REFERENCES userdetails(email_id)  
)
`;
      const createConnectDetailsres = await epool.query(createConnectDetails);
      console.log("connectdetails table created");

      await client.query("COMMIT");
    }

    await epool.query("SELECT * FROM pg_database", (err, res) => {
      console.log({ res }, { err });
      if (err) {
        throw err;
      }
    });

    await epool.query(
      'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
      (err, res) => {
        console.log({ res }, { err });
        if (err) {
          throw err;
        }
      }
    );
  } catch (e) {
    console.log("came to error block");
    await client.query("ROLLBACK");
    console.log({ e });
  } finally {
    client.release();
  }
}

dbSetup();

module.exports = epool;
