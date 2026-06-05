import { Router, Response } from 'express';
import multer from 'multer';
import { supabase, isPlaceholder } from '../lib/supabase';
import { requireAdmin, AuthenticatedRequest } from '../middleware/requireAdmin';

const router = Router();

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit files to 5MB
  }
});

// POST /api/upload - Admin only (Uploads an image to Supabase Storage)
// Expects form field 'image'
router.post(
  '/',
  requireAdmin,
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'Please upload a file' });
        return;
      }

      if (isPlaceholder) {
        // Return a mock placeholder image from Unsplash
        const mockUrls = [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop'
        ];
        const randomUrl = mockUrls[Math.floor(Math.random() * mockUrls.length)];
        res.status(200).json({
          url: randomUrl,
          path: `products/mock-upload-${Date.now()}.jpg`
        });
        return;
      }

      // Generate a unique filename
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        res.status(500).json({ error: `Storage upload failed: ${error.message}` });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      res.status(200).json({
        url: publicUrl,
        path: data.path
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
