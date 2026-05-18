const HolidayPackage = require('../Models/HolidayPackage.model');
const NodeCache = require('node-cache');
const holidayCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

// @desc    Get all holiday packages with search
// @route   GET /api/holidays
const getAllPackages = async (req, res) => {
    try {
        const { search } = req.query;
        
        // Return from cache if no search query
        if (!search && holidayCache.has('all_packages')) {
            return res.status(200).json({
                success: true,
                count: holidayCache.get('all_packages').length,
                data: holidayCache.get('all_packages'),
                cached: true
            });
        }

        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { country: { $regex: search, $options: 'i' } },
                    { type: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const packages = await HolidayPackage.find(query);

        // Save to cache if no search query
        if (!search) {
            holidayCache.set('all_packages', packages);
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
        const pkg = await HolidayPackage.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
        res.status(200).json({ success: true, data: pkg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new holiday package
// @route   POST /api/holidays
const createPackage = async (req, res) => {
    try {
        const data = { ...req.body };
        
        // Parse highlights if sent as string
        if (typeof data.highlights === 'string') {
            data.highlights = data.highlights.split(',').map(h => h.trim()).filter(Boolean);
        }
        
        // Handle uploaded images
        if (req.files && req.files.length > 0) {
            data.images = req.files.map(f => `/uploads/${f.filename}`);
        }
        
        const pkg = await HolidayPackage.create(data);
        holidayCache.del('all_packages');
        res.status(201).json({ success: true, data: pkg, message: 'Package created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a holiday package
// @route   PUT /api/holidays/:id
const updatePackage = async (req, res) => {
    try {
        const data = { ...req.body };
        
        // Parse highlights if sent as string
        if (typeof data.highlights === 'string') {
            data.highlights = data.highlights.split(',').map(h => h.trim()).filter(Boolean);
        }
        
        // Handle existing images (sent as JSON string from form) + new uploads
        let existingImages = [];
        if (data.existingImages) {
            try { existingImages = JSON.parse(data.existingImages); } catch(e) {}
            delete data.existingImages;
        }
        
        const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
        data.images = [...existingImages, ...newImages];
        
        const pkg = await HolidayPackage.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
        holidayCache.del('all_packages');
        res.status(200).json({ success: true, data: pkg, message: 'Package updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a holiday package
// @route   DELETE /api/holidays/:id
const deletePackage = async (req, res) => {
    try {
        const pkg = await HolidayPackage.findByIdAndDelete(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
        holidayCache.del('all_packages');
        res.status(200).json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllPackages, getPackageById, createPackage, updatePackage, deletePackage };
