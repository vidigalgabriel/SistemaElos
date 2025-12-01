const express = require('express');
const router = express.Router();
const tutorsController = require('../controllers/TutorController');
const { isLoggedIn } = require('../middleware/authMiddleware');

router.use(isLoggedIn);

router.get('/dashboard', tutorsController.dashboard);

router.get('/atribuicoes', tutorsController.atribuicoes);

router.get('/mensagens', tutorsController.mensagens);
router.post('/mensagens', tutorsController.mensagens);

router.get('/registros', tutorsController.registrosForm);
router.post('/registros', tutorsController.registrarInformacao);

router.get('/mapa-rotas', tutorsController.mapaRotas);
router.post('/mapa-rotas/start', tutorsController.iniciarRastreio);
router.post('/mapa-rotas/stop', tutorsController.finalizarRastreio);
router.post('/mapa-rotas/update', tutorsController.atualizarPosicao);

router.get('/perfil', tutorsController.perfil);

module.exports = router;