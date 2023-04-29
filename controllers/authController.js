const express = require("express");
const router = new express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var fs = require("fs");
const path = require("path");
const multer = require("multer");
const format = require("pg-format");
const htmlContentPasswordReset = require("../email templates/PasswordReset");
const htmlContentConfirmation = require("../email templates/Confirmation");

var SibApiV3Sdk = require("sib-api-v3-sdk");
var defaultClient = SibApiV3Sdk.ApiClient.instance;

var apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SIB_APIKEY;
const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const tokenKey = process.env.JWT_TOKEN_KEY;
// uploading logo
// router.post("/uploading", (req, res) => {
//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "public/uploads/");
//     },
//     filename: function (req, file, cb) {
//       console.log({ file });
//       cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
//     },
//   });

//   function checkFileType(file, cb) {
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     const mimetype = filetypes.test(file.mimetype);

//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb("Error: jpeg|jpg|png extensions only allowed!");
//     }
//   }

//   const upload = multer({
//     storage: storage,
//     limits: { fileSize: 1000000 },
//     fileFilter: function (req, file, cb) {
//       checkFileType(file, cb);
//     },
//   }).single("image");

//   upload(req, res, (err) => {
//     if (err) {
//       console.log({ err });
//       res.json({
//         success: false,
//         message: err,
//       });
//     } else {
//       const image = req.file.filename;
//       const sql = `INSERT INTO images (image) VALUES ('${image}')`;

//       res.json({
//         success: true,
//         message: "Image uploaded successfully!",
//         filename: image,
//       });
//     }
//   });
// });

// sending mails
function SendMails(type, body) {
  sendSmtpEmail.sender = {
    name: "santosh",
    email: "noreply@gmail.com",
  };

  if (type === "confirmationemail") {
    console.log({ body });
    sendSmtpEmail.subject = "Confirmation Mail";
    sendSmtpEmail.htmlContent = htmlContentConfirmation(
      `http://localhost:3000/confirmationEmail?token=${body?.token}`,
      body?.firstName
    );
    // body?.useremail
    sendSmtpEmail.to = [{ email: body?.useremail }];
    apiInstance
      .sendTransacEmail(sendSmtpEmail)
      .then((data) => {
        console.log("Email sent successfully.", data);
        return body?.res.json({
          usercreated: true,
          confirmationemailsent: true,
        });
      })
      .catch((error) => {
        console.error("Error sending email: ", error);
        return body?.res.json({
          usercreated: true,
          confirmationemailsent: false,
          errorbody: error,
        });
      });
  } else if (type === "forgetpasswordemail") {
    sendSmtpEmail.subject = "Password Reset Mail";
    sendSmtpEmail.htmlContent = htmlContentPasswordReset(
      `http://localhost:3000/passwordReset?token=${body?.token}`
    );
    // body?.useremail
    sendSmtpEmail.to = [{ email: body?.useremail }];
    apiInstance
      .sendTransacEmail(sendSmtpEmail)
      .then((data) => {
        console.log("Email sent successfully.", data);
        return body?.res.json({ forgetpasswordemailsent: true });
      })
      .catch((error) => {
        console.error("Error sending email: ", error);
        return body?.res.json({
          forgetpasswordemailsent: false,
          errorbody: error,
        });
      });
  }
}

// middlewarefunction to verify user token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, tokenKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

//API for test get route
router.get("/get", (req, res) => {
  return res.json({ content: "server is running " });
});

router.post("/welcome", verifyToken, (req, res) => {
  return res.json(`Welcome, ${req?.user?.useremail}`);
});

// API for Forgot password sendemail
router.post("/forgetpasswordemail", async (req, res) => {
  const { userEmail } = req.body;
  if (!userEmail) {
    return res.status(422).json({
      error: `All body params are mandatory "userEmail"`,
    });
  }

  const SelectUser = "SELECT * FROM userdetails WHERE email_id = $1";

  try {
    const response = await db.query(SelectUser, [userEmail]);
    const result = response?.rows;

    if (result?.length > 0) {
      const payload = { useremail: userEmail };
      const token = jwt.sign(payload, tokenKey, {
        expiresIn: 1800,
      });
      const body = {
        token: token,
        useremail: userEmail,
        res: res,
      };
      SendMails("forgetpasswordemail", body);
    } else {
      return res.status(401).json({ error: "User doesn't exist" });
    }
  } catch (err) {
    return res.json({ error: err });
  }
});

// API for resendconfirmationemail
router.post("/resendconfirmationemail", async (req, res) => {
  const { userEmail } = req.body;
  if (!userEmail) {
    return res.status(422).json({
      error: `All body params are mandatory "userEmail"`,
    });
  }

  const SelectUser = "SELECT * FROM userdetails WHERE email_id = $1";

  try {
    const response = await db.query(SelectUser, [userEmail]);
    const result = response?.rows;
    if (result?.length > 0) {
      const payload = { useremail: userEmail };
      const token = jwt.sign(payload, tokenKey, {
        expiresIn: 1800,
      });
      const body = {
        token: token,
        useremail: userEmail,
        res: res,
        firstName: "customer",
      };
      SendMails("confirmationemail", body);
    } else {
      return res.status(401).json({ error: "User doesn't exist" });
    }
  } catch (err) {
    return res.json({ error: err });
  }
});

// API for Change password

router.post("/passwordreset", verifyToken, async (req, res) => {
  const { userPassword } = req.body;
  if (!userPassword) {
    return res.status(422).json({
      error: `All body params are mandatory "userPassword"`,
    });
  }

  const hashedPassword = await bcrypt.hash(userPassword, 10);
  let isPreviousPassword = false;
  let previousPasswordsArrayLength = 0;
  let previousPasswordsArray;

  let getPreviousPasswords = `SELECT recent_passwords FROM userdetails where email_id=$1;`;

  try {
    const response = await db.query(getPreviousPasswords, [
      req?.user?.useremail,
    ]);
    const result = response?.rows;
    console.log({ result });
    console.log(result?.[0]?.recent_passwords);

    if (result?.length > 0) {
      previousPasswordsArray = result?.[0]?.recent_passwords;
      previousPasswordsArrayLength = previousPasswordsArray.length;

      for (let i = 0; i < previousPasswordsArrayLength; i++) {
        console.log(i);
        const previousPasswordMatched = await bcrypt.compare(
          userPassword,
          previousPasswordsArray[i]
        );
        console.log({ previousPasswordMatched });
        if (previousPasswordMatched) {
          isPreviousPassword = true;
        }
      }
      if (isPreviousPassword) {
        return res.status(422).json({
          error: "Password should not match old one.Try new password.",
        });
      } else {
        if (previousPasswordsArrayLength === 5) {
          previousPasswordsArray.shift();
          previousPasswordsArray.push(hashedPassword);
        } else {
          previousPasswordsArray.push(hashedPassword);
        }
        let sql =
          "UPDATE userdetails SET password=$1,recent_passwords=$2  WHERE email_id =$3";
        const response = await db.query(sql, [
          hashedPassword,
          previousPasswordsArray,
          req?.user?.useremail,
        ]);

        const result = response?.rows;

        return res.json({
          success: "password changed successfully",
        });
      }
    }
  } catch (err) {
    console.log(err);
    return res.json({
      error: "token validation successful , db updation failed ",
      errorbody: err,
    });
  }
});

// API for Email confirmation
router.post("/confirmationemail", verifyToken, async (req, res) => {
  let sql =
    "UPDATE userdetails SET is_email_confirmed=true  WHERE email_id = $1";

  try {
    const response = await db.query(sql, [req?.user?.useremail]);
    const result = response?.[0];
    return res.json({ success: "Account Verified" });
  } catch (err) {
    console.log({ err });
    return res.json({
      error: "token validation successful , db updation failed ",
      errorbody: err,
    });
  }
});

// API for user register
router.post("/register", async (req, res) => {
  const {
    userPassword,
    firstName,
    userEmail,
    lastName,
    country,
    companyName,
    companyType,
    roleInCompany,
    previousExperience,
    planToUseData,
  } = req.body;
  if (
    !userPassword ||
    !firstName ||
    !userEmail ||
    !lastName ||
    !country ||
    !companyName ||
    !companyType ||
    !roleInCompany ||
    !previousExperience ||
    !planToUseData
  ) {
    return res.status(422).json({
      error: `All body params are mandatory "userPassword,
      firstName,
      userEmail,
      lastName,
      country,
      companyName,
      companyType,
      roleInCompany,
      previousExperience,
      planToUseData
      "`,
    });
  }

  const hashedPassword = await bcrypt.hash(userPassword, 10);
  const selectUserQuery = format(
    "SELECT * FROM %I WHERE email_id = $1",
    "userdetails"
  );

  console.log("came here");
  try {
    const response = await db.query(selectUserQuery, [userEmail]);
    const result = response?.rows;

    let newName;
    if (result?.length > 0) {
      return res.json({ error: "Email already exists" });
    } else {
      if (!req.files || Object.keys(req.files).length === 0) {
        // return res.status(400).json({ error: "No files were uploaded." });
        newName = "nologouploaded";
        console.log("logo file not uploaded");
      } else {
        const file = req.files.file;

        console.log({ file }, 1 * 1024 * 1024);

        // Validate file size 1MB
        if (file.size > 1 * 1024 * 1024) {
          return res.status(400).json({ error: "File size limit exceeded." });
        }

        // Validate file type
        const allowedExtensions = /png|jpg|jpeg/;
        const isValidExtension = allowedExtensions.test(
          path.extname(file.name).toLowerCase()
        );
        if (!isValidExtension) {
          return res
            .status(400)
            .json({ error: "Only .png, .jpg, and .jpeg files are allowed" });
        }

        newName = "companylogo" + "-" + Date.now() + path.extname(file.name);

        file.mv(`public/logos/${newName}`, async (err) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "while uploading logo", errorbody: err });
          }
        });
      }

      console.log({ newName });
      const sqlInsert = `INSERT INTO userdetails
        (first_name, email_id, password, is_email_confirmed, recent_passwords, last_name, country, company_name, company_type, role_in_company, previous_experience, plan_to_use_data, first_time, connected,logo_url)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15);
        `;
      let recentPasswords = [hashedPassword];
      const response = await db.query(sqlInsert, [
        firstName,
        userEmail,
        hashedPassword,
        false,
        recentPasswords,
        lastName,
        country,
        companyName,
        companyType,
        roleInCompany,
        previousExperience,
        planToUseData,
        false,
        false,
        newName,
      ]);

      const result = response?.rows;

      const payload = { useremail: userEmail };
      const token = jwt.sign(payload, tokenKey, {
        expiresIn: 1800,
      });
      const body = {
        token: token,
        useremail: userEmail,
        firstName: firstName,
        res: res,
      };

      SendMails("confirmationemail", body);
    }
  } catch (err) {
    console.log({ err });
    return res.status(500).json({
      error: "something went wrong while quering",
      errorbody: err,
    });
  }
});
// API for login
router.post("/login", async (req, res) => {
  const { userEmail, userPassword } = req.body;
  if (!userEmail || !userPassword) {
    return res.status(422).json({
      error: `All body params are mandatory "userEmail, userPassword"`,
    });
  }

  const SelectUser = format(
    "SELECT * FROM %I WHERE email_id = $1",
    "userdetails"
  );
  console.log({ SelectUser });
  try {
    const response = await db.query(SelectUser, [userEmail]);
    console.log({ response });
    const result = response?.rows;
    console.log(result, response);

    if (result?.length > 0) {
      console.log({ result });
      if (!result?.[0].is_email_confirmed) {
        console.log({ result });
        return res.status(401).json({ error: "email not confirmed" });
      }
      const response = await bcrypt.compare(
        userPassword,
        result?.[0]?.password
      );

      if (response) {
        const payload = { useremail: userEmail };
        const token = jwt.sign(payload, tokenKey, {
          expiresIn: 21600,
        });

        delete result?.[0]?.password;
        delete result?.[0]?.recent_passwords;
        delete result?.[0]?.id;
        return res.json({
          userdetails: { ...result?.[0] },
          token: token,
        });
      } else {
        return res.status(401).json({ error: "Wrong password" });
      }
    } else {
      return res.status(401).json({ error: "User doesn't exist" });
    }
  } catch (err) {
    {
      console.log({ err });
      return res.status(500).json({
        error: "something went wrong while quering",
        errorbody: err,
      });
    }
  }
});

router.post("/connection", verifyToken, async (req, res) => {
  const { connectionState } = req.body;

  if (!connectionState) {
    return res.status(422).json({
      error: `All body params are mandatory "connectionState"`,
    });
  }

  let sql = "UPDATE userdetails SET connected=$1  WHERE email_id = $2";

  try {
    const response = await db.query(sql, [
      connectionState,
      req?.user?.useremail,
    ]);
    const result = response?.rows;
    return res.json({ success: "connection state updated" });
  } catch (err) {
    console.log({ err });
    return res.json({
      error: "token validation successful , db updation failed ",
      errorbody: err,
    });
  }
});

router.post("/onboarding", verifyToken, async (req, res) => {
  const { firstTime } = req.body;
  if (!firstTime) {
    return res.status(422).json({
      error: `All body params are mandatory "firstTime"`,
    });
  }
  let sql = "UPDATE userdetails SET first_time=$1  WHERE email_id = $2";

  try {
    const response = await db.query(sql, [firstTime, req?.user?.useremail]);
    const result = response?.rows;
    return res.json({ success: "first time state updated" });
  } catch (err) {
    console.log({ err });
    return res.json({
      error: "token validation successful , db updation failed",
      errorbody: err,
    });
  }
});
// console.log(
//   jwt.sign({ useremail: "test@gmail.com" }, tokenKey, {
//     expiresIn: 21600,
//   })
// );
// console.log(
//   jwt.verify(
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyZW1haWwiOiJ0ZXN0QGdtYWlsLmNvIiwiaWF0IjoxNjc5MDQ0NTQ5fQ.U8Xvaq-dm-rVyy6R1uqt7UraNx-igaVQzWQ0YPzPvxc",
//     tokenKey
//   )
// );

// API for uploads file
// router.post("/upload", (req, res) => {
//   if (!req.files || Object.keys(req.files).length === 0) {
//     return res.status(400).json({ error: "No files were uploaded." });
//   }

//   const file = req.files.file;

//   // Validate file type
//   if (!["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)) {
//     return res
//       .status(400)
//       .json({ error: "Only PNG, JPG, and JPEG files are allowed." });
//   }

//   const newName = Date.now() + "-" + file.name;

//   // Use the file
//   file.mv(`public/uploads/${newName}`, (err) => {
//     if (err) {
//       return res.status(500).json({ err });
//     }

//     res.json({ success: newName });
//   });
// });

// API for files check
// router.get("/check-directory", (req, res) => {
//   const directoryPath = "./routes/uploads/";
//   fs.readdir(directoryPath, (err, files) => {
//     if (err) {
//       return res.status(500).json({ error: err });
//     } else {
//       return res.json(files);
//     }
//   });
// });

// bcrypt.hash("test@gmail.com", 10, (e, r) => {
//   console.log({ e }, { r });
// });

// bcrypt.compare(
//   "dsfsf",
//   "$2a$10$EO.1SnmEuadIL.pQ2fibsOwtzEDml.6i/of96ZKJtK4X7Q6GFc046",
//   (e, r) => {
//     console.log({ e }, { r });
//   }
// );
module.exports = { router, verifyToken };
