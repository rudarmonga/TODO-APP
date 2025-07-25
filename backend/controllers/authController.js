const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if(user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ email, password});
        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({token});
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.json({token});
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}