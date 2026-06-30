const express = require('express');
const admin_route = express.Router();
const admin_controller = require('../controller/admin_controller');
const coponDeal_contrller = require('../controller/Deal&Coupons_controller')
const editProductImages = require('../controller/editproductsimages');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const user_route = require('./user_route');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

// S3 Client Configuration
const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
});

// Multer S3 storage configuration
const storage = multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
        const timestamp = Date.now();
        const filename = `${timestamp}${path.extname(file.originalname)}`;
        file.filename = filename; // Map filename so controller is untouched
        cb(null, `products/${filename}`);
    }
});

// File validation and size limits
const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});





//admin middleware for checking if admin is logged in or not
admin_route.use((req, res, next) => {
    if (req.path === '/login') {
        return next();
    }
    if (req.session.AloggedIN) {
        next();
    } else {
        res.redirect('/admin/login');
    }
});

const test2 = (req, res, next) => {
    console.log("testing")
    next()
}
//admin login route
admin_route.get('/login', admin_controller.getlogin)
admin_route.post('/login', admin_controller.postlogin)

// Admin routes
admin_route.get('/dashboard', admin_controller.dashboard);
admin_route.get('/export-sales-report', admin_controller.pdfDownload);
admin_route.get('/export-sales-report-excel', admin_controller.excelDownload);

admin_route.get('/blank', (req, res) => {
    res.render('admin/blank');
});

admin_route.get('/chart', (req, res) => {
    res.render('admin/chart');
});


// admin side products edit codes
admin_route.get('/products', admin_controller.products_details);
admin_route.get('/products/edit/:id', admin_controller.getproducts_editdetails);
admin_route.post('/products/edit/:id', test2, admin_controller.postproducts_editdetails);



//admin side products add codes
admin_route.get('/products/add', admin_controller.getaddproduct);
admin_route.post('/products/add', (req, res) => {
    upload.array('product_images', 3)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error during upload:', err.message);
            return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
        } else if (err) {
            console.error('Unexpected error during upload:', err);
            return res.status(500).json({ success: false, message: 'Error uploading images', error: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }

        console.log('Uploaded files:', req.files); // Debugging info
        admin_controller.addProduct(req, res); // Proceed to add product logic
    });
});



//admin side products action of unlist and list codes
admin_route.post('/toggle-status/:id', admin_controller.toggle_status)




// admin side user details routes
admin_route.get('/user', admin_controller.userdetails);
admin_route.post('/user/update-status', admin_controller.updatestatus);


//admin category routes
admin_route.get('/category', admin_controller.getCategory);
admin_route.get('/category/add', (req, res) => {
    res.render('admin/addCategory.ejs')
});
const test = (req, res, next) => {
    console.log(req.url)
    console.log('rafam')
    next()
}

admin_route.post('/category/add', admin_controller.postAddCategory);
admin_route.post('/categorytoggle-status/:id', admin_controller.categoryToggle_status);
admin_route.get('/categories/edit/:id', admin_controller.getCategory_editdetails);
admin_route.post('/categories/edit/:id', test, admin_controller.postCategory_editdetails);



// admin orders routes 
admin_route.get('/orders', admin_controller.orders);
admin_route.post('/update-order-status', admin_controller.updateOrderStatus)

admin_route.get('/deals', (req, res) => {
    res.render('admin/deals');
});

admin_route.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/dahboard');
});

//admin coupon routes
admin_route.get('/coupons', coponDeal_contrller.getCoupon);

admin_route.post('/coupons/add', coponDeal_contrller.addCoupon);
admin_route.post('/coupon/edit', coponDeal_contrller.editCoupon);
admin_route.post('/coupons/toggle-status', coponDeal_contrller.toggleCouponStatus);


//admin offers rotes 
admin_route.get('/offers', coponDeal_contrller.getOffers);
admin_route.post('/offer/add', coponDeal_contrller.addOffers);
admin_route.post('/offers/toggle-status', coponDeal_contrller.toggleOffersStatus)
admin_route.post('/offers/edit', coponDeal_contrller.editOffer)


// admin return rotues
admin_route.post('/return/approve/:id', test2, admin_controller.orderapprove)
admin_route.post('/return/reject/:id', test2, admin_controller.orderReject)

//admin side user product images edit routes
admin_route.post('/products1/add-image/:productId', (req, res) => {
    upload.single('product_image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error during upload:', err.message);
            return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
        } else if (err) {
            console.error('Unexpected error during upload:', err);
            return res.status(500).json({ success: false, message: 'Error uploading image', error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        console.log('Uploaded file:', req.file); // Debugging info
        editProductImages.addProductImages(req, res); // Call the logic to handle the image addition
    });
});

admin_route.post('/products/:productId/update-image', (req, res) => {
    upload.single('product_image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error during upload:', err.message);
            return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
        } else if (err) {
            console.error('Unexpected error during upload:', err);
            return res.status(500).json({ success: false, message: 'Error uploading image', error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        console.log('Uploaded file:', req.file);
        editProductImages.editProductImages(req, res);
    });
});
admin_route.post('/products/:productId/delete-image', editProductImages.deleteProductImage);




module.exports = admin_route;
