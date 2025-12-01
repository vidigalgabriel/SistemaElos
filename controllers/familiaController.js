const User = require('../models/User');
const Child = require('../models/Child');
const Familia = require('../models/Familia');
const Record = require('../models/Record');
const Message = require('../models/Message');

const FamiliaController = {};


FamiliaController.dashboard = async (req, res) => {
  try {
    const familia = await Familia.findOne({ userId: req.user._id }).populate('tutorSelecionado');
    res.render('familias/dashboard', { user: req.user, familia });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erro ao carregar dashboard');
    res.redirect('/');
  }
};


FamiliaController.buscarTutores = async (req, res) => {
  try {
    const tutores = await User.find({ role: 'tutor' }).populate('tutorData');
    
    const familia = await Familia.findOne({ userId: req.user._id })
      .populate({ 
        path: 'tutorSelecionado', 
        populate: { path: 'tutorData' } 
      });
      
    res.render('familias/buscarTutor', { 
      user: req.user, 
      tutores, 
      selectedTutor: familia?.tutorSelecionado || null
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erro ao buscar tutores');
    res.redirect('/familias/dashboard');
  }
};


FamiliaController.selecionarTutor = async (req, res) => {
  try {
    const { tutorId } = req.body;
    if (!tutorId) return res.redirect('/familias/buscarTutor');

    const familiaId = req.user._id;
    const child = await Child.findOne({ guardian: familiaId });
    let familia = await Familia.findOne({ userId: familiaId });

    if (!familia) {
      familia = await Familia.create({ userId: familiaId, tutorSelecionado: tutorId });
    } else {
      familia.tutorSelecionado = tutorId;
      await familia.save();
    }

    if (child) child.assignedTutor = tutorId;
    if (child) await child.save();

    req.flash('success', 'Tutor selecionado com sucesso');
    res.redirect('/familias/buscarTutor');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erro ao selecionar tutor');
    res.redirect('/familias/buscarTutor');
  }
};


FamiliaController.registros = async (req, res) => {
  try {
    const child = await Child.findOne({ guardian: req.user._id });
    const registros = child 
      ? await Record.find({ childId: child._id }).populate('tutorId').sort({ data: -1 }) 
      : [];
    res.render('familias/registros', { user: req.user, registros });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erro ao carregar registros');
    res.redirect('/familias/dashboard');
  }
};


FamiliaController.acompanharTrajeto = async (req, res) => {
  try {
    const child = await Child.findOne({ guardian: req.user._id });
    
    
    const isTracking = child && child.tracking;
    const locationData = child && child.location && child.location.latitude 
      ? [{ latitude: child.location.latitude, longitude: child.location.longitude }] 
      : [];

    res.render('familias/trajeto', { 
      user: req.user, 
      locations: locationData,
      tracking: isTracking, 
      tutorId: child?.assignedTutor || null
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erro ao carregar trajeto');
    res.redirect('/familias/dashboard');
  }
};


FamiliaController.mensagens = async (req, res) => {
  try {
    const familia = await Familia.findOne({ userId: req.user._id }).populate('tutorSelecionado');
    const tutor = familia?.tutorSelecionado;

    let messages = [];
    if (tutor) {
      messages = await Message.find({
        $or: [
          { sender: req.user._id, receiver: tutor._id },
          { sender: tutor._id, receiver: req.user._id }
        ]
      }).sort({ createdAt: -1 }).populate('sender receiver');
    }

    res.render('familias/mensagens', { user: req.user, messages, tutor });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erro ao carregar mensagens');
    res.redirect('/familias/dashboard');
  }
};


FamiliaController.enviarMensagem = async (req, res) => {
  try {
    const { content } = req.body;
    const familia = await Familia.findOne({ userId: req.user._id }).populate('tutorSelecionado');
    const tutor = familia?.tutorSelecionado;

    if (!tutor || !content) return res.redirect('/familias/mensagens');

    await Message.create({ sender: req.user._id, receiver: tutor._id, content });

    req.flash('success', 'Mensagem enviada');
    res.redirect('/familias/mensagens');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erro ao enviar mensagem');
    res.redirect('/familias/mensagens');
  }
};


FamiliaController.getTutorLocation = async (req, res) => {
  try {
    const child = await Child.findOne({ guardian: req.user._id });

    if (!child) {
      return res.json({ status: 'no-child' });
    }

    if (child.tracking && child.location && child.location.latitude) {
      return res.json({ 
        status: 'tracking', 
        latitude: child.location.latitude, 
        longitude: child.location.longitude 
      });
    } else {
      return res.json({ status: 'offline' });
    }
  } catch (err) {
    console.error(err);
    res.json({ status: 'error' });
  }
};

FamiliaController.getMensagensApi = async (req, res) => {
  try {
    const familia = await Familia.findOne({ userId: req.user._id }).populate('tutorSelecionado');
    const tutor = familia?.tutorSelecionado;

    if (!tutor) {
      return res.json([]);
    }

    const query = {
      $or: [
        { sender: req.user._id, receiver: tutor._id },
        { sender: tutor._id, receiver: req.user._id }
      ]
    };

    if (req.query.lastMessageTimestamp) {
      query.createdAt = { $gt: new Date(req.query.lastMessageTimestamp) };
    }
    
    const messages = await Message.find(query).sort({ createdAt: 'asc' });
    res.json(messages);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
};

module.exports = FamiliaController;