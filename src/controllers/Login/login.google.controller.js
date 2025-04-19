const { OAuth2Client } = require('google-auth-library');
require("dotenv").config();
const CLIENT_ID = process.env.GG_CLIENT_ID; 

// Tạo một phiên bản của OAuth2Client với ID Google Client của bạn
const client = new OAuth2Client(process.env.GG_CLIENT_ID, process.env.GG_CLIENT_SECRET);

const verifyGoogleToken = async (req, res) => {
  const { idToken } = req.body; 

  if (!idToken) {
    return res.status(400).json({ error: 'No ID token provided' });
  }

  try {
    // Xác minh mã thông báo ID bằng OAuth2Client của Google
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID, 
    });

    // Lấy payload từ token
    const payload = ticket.getPayload();
    console.log(payload);  
    
    return res.status(200).json({ user: payload });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ error: 'Failed to verify Google ID token' });
  }
};

module.exports = { verifyGoogleToken };
