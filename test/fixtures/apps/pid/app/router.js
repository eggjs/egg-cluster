module.exports = app => {
  app.get('/exit', () => {
    process.exit(1);
  });
};
