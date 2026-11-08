const fs = require('fs');

function sanitize(message) {
  if (typeof message === 'string') {
    return message.replace(/password[:=]\s*["']?[^"'\s]+["']?/gi, 'password=***');
  }
  return message;
}

const logger = {
  info: (msg, ...args) => console.log(`[INFO]  ${new Date().toISOString()} - ${sanitize(msg)}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN]  ${new Date().toISOString()} - ${sanitize(msg)}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${new Date().toISOString()} - ${sanitize(msg)}`, ...args),
  debug: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${sanitize(msg)}`, ...args);
    }
  },
};

module.exports = logger;

