require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP Connection Failed:', error);
        process.exit(1);
    } else {
        console.log('SMTP Connection Successful!');
        process.exit(0);
    }
});
