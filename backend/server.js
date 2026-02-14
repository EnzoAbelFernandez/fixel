const { app, conectarDB } = require('./app');

const startServer = async () => {
  await conectarDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
};

if (require.main === module) startServer();
