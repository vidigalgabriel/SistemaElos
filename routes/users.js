const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const Child = require('../models/Child');
const Record = require('../models/Record');
const Location = require('../models/Location');

router.get('/register', (req, res) => {
    res.render('users/register');
});

router.post('/register', async (req, res, next) => {
    try {
        const { 
            name, 
            email, 
            password, 
            role, 
            childName, 
            childBirthDate, 
            childSpecialNeeds, 
            faculdade, 
            idade, 
            observacoes, 
            experiencia 
        } = req.body;
        
        const user = new User({ name, email, role });

        const registeredUser = await User.register(user, password);

        if (registeredUser.role === 'tutor') {
            registeredUser.tutorData.faculdade = faculdade || '';
            registeredUser.tutorData.idade = idade || null;
            registeredUser.tutorData.observacoes = observacoes || '';
            
            await registeredUser.save(); 

        } else if (registeredUser.role === 'familia') {
            if (childName) {
                const child = new Child({
                    name: childName,
                    birthDate: childBirthDate,
                    specialNeeds: childSpecialNeeds,
                    guardian: registeredUser._id
                });
                if (req.body.childAge) child.age = req.body.childAge; 
                
                await child.save();
            }
        }
        
        req.login(registeredUser, err => {
            if (err) return next(err);

            req.flash('success', 'Cadastro realizado com sucesso!');
            
            if (registeredUser.role === 'tutor') {
                return res.redirect('/tutors/dashboard');
            } else if (registeredUser.role === 'familia') {
                return res.redirect('/familias/dashboard');
            } else {
                return res.redirect('/');
            }
        });
    } catch (e) {
        let errorMessage = e.message;
        if (e.name === 'UserExistsError') {
             errorMessage = 'Este email já está cadastrado.';
        }
        req.flash('error', errorMessage);
        res.redirect('/users/register');
    }
});

router.get('/login', (req, res) => {
    res.render('users/login');
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/users/login',
    failureFlash: true
}), (req, res) => {
    req.flash('success', 'Bem-vindo!');

    if (req.user.role === 'tutor') {
        res.redirect('/tutors/dashboard');
    } else if (req.user.role === 'familia') {
        res.redirect('/familias/dashboard');
    } else {
        res.redirect('/');
    }
});

router.delete('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success', 'Deslogado com sucesso');
        res.redirect('/users/login');
    });
});

module.exports = router;