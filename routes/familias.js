const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const familiaController = require('../controllers/familiaController');

router.use(isLoggedIn);

router.get('/dashboard', familiaController.dashboard);

router.get('/buscarTutor', familiaController.buscarTutores);
router.post('/buscarTutor/selecionar', familiaController.selecionarTutor);

router.get('/registros', familiaController.registros);

router.get('/trajeto', familiaController.acompanharTrajeto);

router.get('/api/tutor-location', familiaController.getTutorLocation);

router.get('/mensagens', familiaController.mensagens);
router.post('/mensagens/enviar', familiaController.enviarMensagem);
router.get('/api/mensagens', familiaController.getMensagensApi);

router.get('/perfil', (req, res) => {
    res.redirect(`/profiles/${req.user._id}`);
});

module.exports = router;