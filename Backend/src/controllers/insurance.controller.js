const InsurancePackage = require('../Models/InsurancePackage.model');
const NodeCache = require('node-cache');
const insuranceCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

// @desc    Get all insurance packages with search
// @route   GET /api/insurance
const getAllPackages = async (req, res) => {
    try {
        const { search } = req.query;
        
        if (!search && insuranceCache.has('all_insurance')) {
            return res.status(200).json({
                success: true,
                count: insuranceCache.get('all_insurance').length,
                data: insuranceCache.get('all_insurance'),
                cached: true
            });
        }

        let query = {};
        if (search) {
            query = {
                $or: [
                    { provider: { $regex: search, $options: 'i' } },
                    { plan: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const packages = await InsurancePackage.find(query);

        if (!search) {
            insuranceCache.set('all_insurance', packages);
        }

        res.status(200).json({
            success: true,
            count: packages.length,
            data: packages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPackageById = async (req, res) => {
    try {
        const pkg = await InsurancePackage.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: 'Insurance package not found' });
        res.status(200).json({ success: true, data: pkg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new insurance package
// @route   POST /api/admin/insurance
const createPackage = async (req, res) => {
    try {
        const data = { ...req.body };
        
        if (typeof data.features === 'string') {
            data.features = data.features.split(',').map(h => h.trim()).filter(Boolean);
        }
        
        if (req.files && req.files.length > 0) {
            data.images = req.files.map(f => `/uploads/${f.filename}`);
        }
        
        const pkg = await InsurancePackage.create(data);
        insuranceCache.del('all_insurance');
        res.status(201).json({ success: true, data: pkg, message: 'Insurance package created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update an insurance package
// @route   PUT /api/admin/insurance/:id
const updatePackage = async (req, res) => {
    try {
        const data = { ...req.body };
        
        if (typeof data.features === 'string') {
            data.features = data.features.split(',').map(h => h.trim()).filter(Boolean);
        }
        
        let existingImages = [];
        if (data.existingImages) {
            try { existingImages = JSON.parse(data.existingImages); } catch(e) {}
            delete data.existingImages;
        }
        
        const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
        data.images = [...existingImages, ...newImages];
        
        const pkg = await InsurancePackage.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!pkg) return res.status(404).json({ success: false, message: 'Insurance package not found' });
        insuranceCache.del('all_insurance');
        res.status(200).json({ success: true, data: pkg, message: 'Insurance package updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an insurance package
// @route   DELETE /api/admin/insurance/:id
const deletePackage = async (req, res) => {
    try {
        const pkg = await InsurancePackage.findByIdAndDelete(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: 'Insurance package not found' });
        insuranceCache.del('all_insurance');
        res.status(200).json({ success: true, message: 'Insurance package deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllPackages, getPackageById, createPackage, updatePackage, deletePackage };
