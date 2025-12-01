const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/User');
require('dotenv').config();

const app = express();

const userRoutes = require('./routes/users');
const tutorRoutes = require('./routes/tutors');
const familiaRoutes = require('./routes/familias');
const childrenRoutes = require('./routes/childrens');
const occurrenceRoutes = require('./routes/occurrences');
const logRoutes = require('./routes/logs');
const profileRoutes = require('./routes/profiles');

const dbUrl = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elos';
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexão:'));
db.once('open', () => console.log('Banco de dados conectado.'));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: process.env.SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/', (req, res) => res.render('home'));

app.use('/users', userRoutes);
app.use('/familias', familiaRoutes);
app.use('/tutors', tutorRoutes);
app.use('/childrens', childrenRoutes);
app.use('/occurrences', occurrenceRoutes);
app.use('/logs', logRoutes);
app.use('/profiles', profileRoutes);

app.use((req, res, next) => {
    res.status(404).render('error', { err: 'Página não encontrada.' });
});

app.use((err, req, res, next) => {
    const { status = 500, message = 'Erro interno do servidor.' } = err;
    res.status(status).render('error', { err: message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
