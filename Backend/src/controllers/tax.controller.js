const TaxRule = require('../Models/TaxRule.model');

const getTaxRules = async (req, res) => {
    try {
        const rules = await TaxRule.find();
        res.status(200).json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createTaxRule = async (req, res) => {
    try {
        const rule = await TaxRule.create(req.body);
        res.status(201).json({ success: true, message: 'Tax rule created', data: rule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTaxRule = async (req, res) => {
    try {
        const rule = await TaxRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, message: 'Tax rule updated', data: rule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteTaxRule = async (req, res) => {
    try {
        await TaxRule.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Tax rule deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getTaxRules, createTaxRule, updateTaxRule, deleteTaxRule };
