const { createApp } = require('./app'); //loads file app.js --> createApp object is created
//proceess end PORT reads the PORT environemnt, conver or default to 3000.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = createApp();//calls createApp function
app.listen(PORT, ()=> {
    console.log(`Listening on http://localhost:${PORT}`);

});


