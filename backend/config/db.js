const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    // Añadimos una opción para que falle rápido si no hay servidor disponible
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Si no encuentra servidor en este tiempo, fallará rápidamente
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión: ${error.message}`);
    console.error('Asegurate de que MongoDB esté corriendo en localhost:27017 o que MONGO_URI esté apuntando a una instancia válida.');
    process.exit(1);
  }
};

module.exports = conectarDB;