const MarkupRule = require('../Models/MarkupRule.model');

const setMarkupRule = async (req, res, next) => {
    try {
        console.log('MARKUP_SAVE_REQUEST_BODY:', req.body);
        console.log('MARKUP_SAVE_REQUEST_USER:', req.user ? req.user._id : 'NO_USER');
        const { serviceType, airline, refundType, markupType, markupValue, priority, isActive, targetAgentCode } = req.body;
        
        // Validation
        if (markupValue === undefined || markupValue === null || isNaN(Number(markupValue))) {
            return res.status(400).json({ success: false, message: 'Invalid markup value provided' });
        }

        const filter = { 
            serviceType: serviceType || 'DOMESTIC_FLIGHT', 
            airline: airline || 'ALL', 
            refundType: refundType || 'All',
            targetAgentCode: targetAgentCode || 'ALL'
        };

        const update = { 
            markupType: markupType || 'Fixed', 
            markupValue: Number(markupValue), 
            priority: Number(priority) || 0, 
            isActive: isActive !== undefined ? isActive : true,
            targetAgentCode: targetAgentCode || 'ALL'
        };

        const rule = await MarkupRule.findOneAndUpdate(filter, update, { 
            new: true, 
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        });
        
        res.status(200).json({ 
            success: true, 
            message: 'Markup rule saved successfully', 
            data: rule 
        });
    } catch (error) {
        console.error('SET_MARKUP_RULE_ERROR:', error);
        res.status(500).json({ 
            success: false, 
            message: error.name === 'ValidationError' ? 'Validation error: ' + error.message : 'Database error: ' + error.message
        });
    }
};

const getMarkupRules = async (req, res, next) => {
    try {
        const rules = await MarkupRule.find().sort({ priority: -1, createdAt: -1 });
        res.status(200).json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMarkupRule = async (req, res, next) => {
    try {
        await MarkupRule.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Markup rule deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { setMarkupRule, getMarkupRules, deleteMarkupRule };
