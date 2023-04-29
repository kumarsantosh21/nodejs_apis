const db = require("../config/db");
const https = require("https");
const format = require("pg-format");

const encrpytKey = process.env.COLUMN_ENCRYPT_KEY;

const sourceDetails = async (req, res) => {
  let sql = `SELECT * from sources  where email_id = $1`;
  try {
    const response = await db.query(sql, [req?.user?.useremail]);
    const result = response?.rows;
    return res.json({ data: result });
  } catch (err) {
    console.log({ err });
    return res.json({
      error: "token validation successful , Failed while quering ",
      errorbody: err,
    });
  }
};

const Connect = async (req, res) => {
  const { sourceType, shop, api, token, fromDate } = req.body;

  if (!sourceType || !shop || !api || !token || !fromDate) {
    return res.status(422).json({
      error: `All body params are mandatory , some of them are missing`,
    });
  }

  let sql1 = `INSERT INTO sources  (email_id, source_type , progress ,sync_status)
  VALUES ($1,$2,$3,$4)`;
  let sql2 = `INSERT INTO connectdetails  (email_id, shop , api ,token,fromdate)
  VALUES ($1,$2,pgp_sym_encrypt($3,$6),pgp_sym_encrypt($4,$6),$5)`;

  const connection = await db.connect();

  try {
    await connection.query("BEGIN");

    const result1 = await connection.query(sql1, [
      req?.user?.useremail,
      sourceType,
      0,
      "initiated",
    ]);

    const result2 = await connection.query(sql2, [
      req?.user?.useremail,
      shop,
      api,
      token,
      fromDate,
      encrpytKey,
    ]);

    await connection.query("COMMIT");

    https.get(url, (resp) => {
      // let data = "";
      // resp.on("data", (chunk) => {
      //   data += chunk;
      //   console.log({ data });
      // });
      // resp.on("end", () => {
      //   return res.json({
      //     data: JSON.parse(data),
      //     info: "calling backend to trigger pipeline",
      //   });
      // });
    });
    // .on("error", (err) => {
    //   console.log("Error: " + err);
    //   return res.json({ err: err });
    // });

    return res.json({ status: "success" });
  } catch (err) {
    console.log({ err });
    await connection.query("ROLLBACK");
    return res.json({
      error:
        "token validation successful , Failed while quering and api invoking",
      errorbody: err,
    });
  }
};

const TestConnect = async (req, res) => {
  const { sourceType, shop, api, token, fromDate } = req.body;

  if (!sourceType || !shop || !api || !token || !fromDate) {
    return res.status(422).json({
      error: `All body params are mandatory , some of them are missing`,
    });
  }

  try {
    https
      .get(url, (resp) => {
        let data = "";
        resp.on("data", (chunk) => {
          data += chunk;
          console.log({ data });
        });
        resp.on("end", () => {
          return res.json({
            data: JSON.parse(data),
            info: "calling backend to test api details",
          });
        });
      })
      .on("error", (err) => {
        console.log("Error: " + err);
        return res.json({ err: err });
      });
  } catch (err) {
    console.log({ err });
    return res.json({
      error: "token validation successful , Failed while testing api",
      errorbody: err,
    });
  }
};

module.exports = { sourceDetails, Connect, TestConnect };
