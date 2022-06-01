const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const fs = require('fs');
const { Media } = require('../models');

// get images
router.get('/', async (req, res) => {
  const media = await Media.findAll({ attributes: ['id', 'image'] });

  const mappedMedia = media.map((m) => {
    m.image = `${req.get('host')}/images/${m.image}`;
    return m;
  });

  return res.json({ status: 'success', data: mappedMedia });
});

// upload image
router.post('/', function (req, res) {
  const image = req.body.image;

  console.log(image);

  if (!isBase64(image, { mimeRequired: true })) {
    return res.status(400).json({
      status: 'error',
      message: 'invalid base64 Image',
    });
  }

  base64Img.img(image, './public/images', Date.now(), async (err, filepath) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'error saving image',
      });
    }

    const filename = filepath.split('\\').pop().split('/').pop();
    const media = await Media.create({ image: filename });

    console.log(media);

    return res.status(200).json({
      status: 'success',
      message: 'image saved',
      data: {
        image: filename,
      },
    });
  });
});

// delete image
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  const media = await Media.findByPk(id);

  // if not exist
  if (!media) {
    return res.status(404).json({
      status: 'error',
      message: 'image not found',
    });
  }

  fs.unlink(`./public/images/${media.image}`, async (err) => {
    // if not exist
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: err.message,
      });
    }

    // if exist
    await media.destroy();
    return res.status(200).json({
      status: 'success',
      message: 'image deleted',
    });
  });
});

module.exports = router;
