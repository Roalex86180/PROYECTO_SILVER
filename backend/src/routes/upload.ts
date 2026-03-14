import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import multer from 'multer'
import sharp from 'sharp'

const router = Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/webp',
            'image/heic', 'image/heif', 'image/tiff',
            'application/pdf'
        ]
        if (allowed.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Only images and PDF are allowed'))
        }
    }
})

router.post('/receipt', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file provided' })
            return
        }

        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        )

        let fileBuffer = req.file.buffer
        let contentType = req.file.mimetype
        let fileName = ''

        if (contentType === 'application/pdf') {
            fileName = `receipt_${Date.now()}.pdf`
        } else {
            fileBuffer = await sharp(req.file.buffer)
                .rotate()
                .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 75 })
                .toBuffer()
            contentType = 'image/jpeg'
            fileName = `receipt_${Date.now()}.jpg`
        }

        const { error } = await supabase.storage
            .from('receipts')
            .upload(fileName, fileBuffer, { contentType, upsert: false })

        if (error) {
            console.error('Supabase upload error:', error)
            res.status(500).json({ error: 'Error uploading file' })
            return
        }

        const { data } = supabase.storage.from('receipts').getPublicUrl(fileName)
        res.json({ url: data.publicUrl })

    } catch (err) {
        console.error('ERROR UPLOAD:', err)
        res.status(500).json({ error: 'Error uploading file' })
    }
})

export default router