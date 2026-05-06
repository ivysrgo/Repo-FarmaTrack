const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

connectDB(); // ← llamas la conexión aquí

app.listen(3000, () => console.log('Servidor corriendo'));