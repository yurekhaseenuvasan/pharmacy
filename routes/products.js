const { Product } = require('../models/product')
const express = require('express')
const { Category } = require('../models/category')
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype]
        let uploadError = new Error('Invalid image type')
        if (isValid) {
            uploadError = null
        }
        cb(uploadError, 'public/upload')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-')
        const extension = FILE_TYPE_MAP[file.mimetype]
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    },
})
const uploadOptions = multer({ storage: storage })
router.get(`/`, async (req, res) => {
    let filter = {}
    //localhost:3000/api/v1/products?categories=23456,2345647
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }
    const productList = await Product.find(filter).populate('category')

    if (!productList) {
        res.status(500).json({ success: false })
    }
    res.send(productList)
})
router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category')

    if (!product) {
        res.status(500).json({ success: false })
    }
    res.send(product)
})

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category)

    if (!category) {
        return res.status(400).send('invalid category')
    }
    const file = req.file
    if (!file) {
        return res.status(400).send('No  image file')
    }
    const fileName = file.filename
    const basePath = `${req.protocol}://${req.get('host')}/public/upload/`
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        image: `${basePath}${fileName}`, //"http://localhost:3000/public/uploads/img-234567",
        price: req.body.price,
        category: req.body.category,
        expiryDate: req.body.expiryDate,
    })

    product = await product.save()

    if (!product) {
        return res.status(404).send('product not found')
    }
    res.send(product)
})

router.put(`/:id`, uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send('Invalid product')
    }
    const category = await Category.findById(req.body.category)
    if (!category) {
        return res.status(400).send('Invalid category')
    }
    const product = await Product.findById(req.params.id)
    if (!product) {
        return res.status(400).send('Invalid category')
    }
    const file = req.file
    let imagePath
    if (file) {
        const fileName = file.filename
        const basePath = `${req.protocol}://${req.get('host')}/public/upload/`
        imagePath = `${basePath}${fileName}`
    } else {
        imagePath = product.image
    }

    const updatedproduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            image: imagePath,
            price: req.body.price,
            category: req.body.category,
            expiryDate: req.body.expiryDate,
        },
        { new: true }
    )

    if (!updatedproduct) {
        return res.status(404).send('product cannot be created')
    }
    res.send(updatedproduct)
})
router.delete(`/:id`, (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then((product) => {
            if (product) {
                return res
                    .status(200)
                    .json({ success: true, message: 'Product is deleted' })
            }
            return res
                .status(404)
                .json({ success: false, message: 'Product is not deleted' })
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err })
        })
})

router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments()

    if (!productCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        productCount: productCount,
    })
})
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({ isFeatured: true }).limit(+count)

    if (!products) {
        res.status(500).json({ success: false })
    }
    res.send(products)
})
router.put(
    `/gallery-images/:id`,
    uploadOptions.array('images', 10),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).send('Invalid product')
        }
        const files = req.files
        let imagePath = []
        const basePath = `${req.protocol}://${req.get('host')}/public/upload/`
        if (files) {
            files.map((files) => {
                imagePath.push(`${basePath}${files.filename}`)
            })
        }
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagePath,
            },
            { new: true }
        )

        if (!product) {
            return res.status(404).send('Image cannot be updated')
        }
        res.send(product)
    }
)

module.exports = router
