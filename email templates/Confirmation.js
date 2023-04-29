function Confirmation(url, name) {
  return `
  <!DOCTYPE html>
  <html>
  <title>Confirmation Mail</title>
  <head>
  </head>
  <body>
  <h1>Hi ${name}</h1>
  <div>click <a href=${url}>here</a> to confirm your email</div>
  </body>
  </html>
  `;
}

module.exports = Confirmation;
