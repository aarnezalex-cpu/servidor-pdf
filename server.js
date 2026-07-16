/**
 * ============================================
 * 🚀 API DE CONVERSIÓN WORD → PDF (Node.js)
 * ============================================
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const libre = require('libreoffice-convert'); // Cambiado para compatibilidad en la nube

// ============================================
// 🔧 CONFIGURACIÓN INICIAL
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir conexiones externas (app móvil)
app.use(cors());

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ============================================
// 📂 CONFIGURACIÓN DE MULTER
// ============================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('❌ Solo se permiten archivos Word (.doc, .docx)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// ============================================
// 🔄 ENDPOINT PRINCIPAL
// ============================================

app.post('/convertir', upload.single('documento'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ningún archivo' });
        }

        const inputPath = req.file.path;
        const outputPath = inputPath.replace(/\.(docx|doc)$/i, '.pdf');

        // Leer el archivo Word subido
        const docxBuf = fs.readFileSync(inputPath);

        // ============================================
        // 🧠 CONVERSIÓN FIEL AL FORMATO ORIGINAL
        // ============================================
        libre.convert(docxBuf, '.pdf', undefined, (err, pdfBuf) => {
            if (err) {
                console.error('Error en conversión:', err);
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                return res.status(500).json({ error: 'Error al convertir el documento' });
            }

            // Guardar el PDF convertido temporalmente
            fs.writeFileSync(outputPath, pdfBuf);

            // ============================================
            // 📤 ENVÍO DEL PDF A LA APP MÓVIL
            // ============================================
            res.sendFile(path.resolve(outputPath), (err) => {
                // 🧹 LIMPIEZA AUTOMÁTICA
                try {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                } catch (cleanupError) {
                    console.error('Error al limpiar archivos:', cleanupError);
                }

                if (err) {
                    console.error('Error al enviar archivo:', err);
                }
            });
        });

    } catch (error) {
        console.error('Error general:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/', (req, res) => {
    res.send('API Word → PDF funcionando perfectamente 🚀');
});

app.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});
