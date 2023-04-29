function PasswordReset(url) {
  return `
  <!DOCTYPE html>
  <html>
  <title>Password Reset</title>
  <head>
  </head>
  <body>
  
  <div>click <a href=${url}>here</a> to reset your password</div>
  </body>
  </html>
   `;
}

module.exports = PasswordReset;
