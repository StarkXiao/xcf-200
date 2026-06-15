const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDataPath(filename) {
  ensureDataDir();
  return path.join(DATA_DIR, filename);
}

function readJSON(filename) {
  const filePath = getDataPath(filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

function writeJSON(filename, data) {
  const filePath = getDataPath(filename);
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return true;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  readJSON,
  writeJSON,
  generateId,
  DATA_DIR
};
