const VisaPackage = require('../Models/VisaPackage.model');
const NodeCache = require('node-cache');
const visaCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

// @desc    Get all visa packages with search
// @route   GET /api/visas
const getAllPackages = async (req, res) => {
    try {
        const { search } = req.query;
        
        // Return from cache if no search query
        if (!search && visaCache.has('all_visas')) {
            return res.status(200).json({
                success: true,
                count: visaCache.get('all_visas').length,
                data: visaCache.get('all_visas'),
                cached: true
            });
        }

        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { country: { $regex: search, $options: 'i' } },
                    { visaType: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const packages = await VisaPackage.find(query);

        // Save to cache if no search query
        if (!search) {
            visaCache.set('all_visas', packages);
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
        const pkg = await VisaPackage.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: 'Visa package not found' });
        res.status(200).json({ success: true, data: pkg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new visa package
// @route   POST /api/admin/visas
const createPackage = async (req, res) => {
    try {
        const data = { ...req.body };
        
        // Parse documentsRequired if sent as string
        if (typeof data.documentsRequired === 'string') {
            data.documentsRequired = data.documentsRequired.split(',').map(h => h.trim()).filter(Boolean);
        }
        
        // Handle uploaded images
        if (req.files && req.files.length > 0) {
            data.images = req.files.map(f => `/uploads/${f.filename}`);
        }
        
        const pkg = await VisaPackage.create(data);
        visaCache.del('all_visas');
        res.status(201).json({ success: true, data: pkg, message: 'Visa package created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a visa package
// @route   PUT /api/admin/visas/:id
const updatePackage = async (req, res) => {
    try {
        const data = { ...req.body };
        
        // Parse documentsRequired if sent as string
        if (typeof data.documentsRequired === 'string') {
            data.documentsRequired = data.documentsRequired.split(',').map(h => h.trim()).filter(Boolean);
        }
        
        // Handle existing images (sent as JSON string from form) + new uploads
        let existingImages = [];
        if (data.existingImages) {
            try { existingImages = JSON.parse(data.existingImages); } catch(e) {}
            delete data.existingImages;
        }
        
        const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
        data.images = [...existingImages, ...newImages];
        
        const pkg = await VisaPackage.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!pkg) return res.status(404).json({ success: false, message: 'Visa package not found' });
        visaCache.del('all_visas');
        res.status(200).json({ success: true, data: pkg, message: 'Visa package updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a visa package
// @route   DELETE /api/admin/visas/:id
const deletePackage = async (req, res) => {
    try {
        const pkg = await VisaPackage.findByIdAndDelete(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: 'Visa package not found' });
        visaCache.del('all_visas');
        res.status(200).json({ success: true, message: 'Visa package deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllPackages, getPackageById, createPackage, updatePackage, deletePackage };
