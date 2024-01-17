require('dotenv').config();
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const express = require('express');
const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Cron job every Saturday at midnight
cron.schedule('* * * * *', () => {
  console.log('------------------------');
  console.log('Email cron job running...');
  console.log('------------------------');

  let messageOptions = {
    from: process.env.SMTP_USER,
    to: 'justTrying@example.com',
    subject: 'Cron job test',
    text: 'Hello! This email was automatically sent by node.js and its cron job.',
  };

  transporter.sendMail(messageOptions, (error, info) => {
    if (error) {
      if (error.syscall == 'getaddrinfo') {
        console.log("!!! - Can't connect to SMTP server.");
      }
      throw error;
    } else {
      console.log('Email successfully sent!');
    }
  });
});

module.exports = router;
