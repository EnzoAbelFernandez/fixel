require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('No se encontró MONGO_URI en .env');
  process.exit(1);
}

const test = async () => {
  try {
    console.log('Intentando conectar a MongoDB con MONGO_URI=', uri.replace(/:(.*)@/, ':*****@'));
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Conexión a MongoDB exitosa ✅');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(2);
  }
};

test();
