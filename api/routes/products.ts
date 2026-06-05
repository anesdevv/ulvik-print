import { Router, Response } from 'express';
import { supabase, isPlaceholder } from '../lib/supabase';
import { requireAdmin, AuthenticatedRequest } from '../middleware/requireAdmin';

const router = Router();

// In-memory mock database fallback
let mockProducts: any[] = [
  {
    id: "dev-p1",
    name_fr: "T-shirt Classic Black",
    name_en: "Classic Black T-Shirt",
    description_fr: "Notre t-shirt classique 100% coton de qualité supérieure, sérigraphié à Tlemcen.",
    description_en: "Our classic 100% cotton t-shirt of premium quality, screenprinted in Tlemcen.",
    price: 2500,
    category: "Classic",
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ label: "Noir / Black", hex: "#000000" }, { label: "Blanc / White", hex: "#ffffff" }],
    in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: "dev-p2",
    name_fr: "T-shirt Vintage Green",
    name_en: "Vintage Green T-Shirt",
    description_fr: "Design vintage rétro inspiré des années 90, coupe oversize.",
    description_en: "Retro vintage design inspired by the 90s, oversize fit.",
    price: 2900,
    category: "Vintage",
    images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop"],
    sizes: ["M", "L", "XL", "XXL"],
    colors: [{ label: "Vert / Green", hex: "#1e3f20" }, { label: "Orange", hex: "#ff5a1f" }],
    in_stock: true,
    created_at: new Date().toISOString()
  }
];

// GET /api/products - Public lists in-stock, admin can list all
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token === 'dev-admin-token' || isPlaceholder) {
        isAdmin = true;
      } else {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          isAdmin = true;
        }
      }
    }

    if (isPlaceholder) {
      const data = isAdmin ? mockProducts : mockProducts.filter(p => p.in_stock);
      res.json(data);
      return;
    }

    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    
    if (!isAdmin) {
      query = query.eq('in_stock', true);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id - Public
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isPlaceholder) {
      const product = mockProducts.find(p => p.id === id);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json(product);
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products - Admin only
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name_en,
      name_fr,
      description_en,
      description_fr,
      price,
      category,
      images,
      sizes,
      colors,
      in_stock
    } = req.body;

    if (!name_en || !name_fr || price === undefined) {
      res.status(400).json({ error: 'Name (EN/FR) and Price are required' });
      return;
    }

    if (isPlaceholder) {
      const newProduct = {
        id: `dev-p${Date.now()}`,
        name_en,
        name_fr,
        description_en,
        description_fr,
        price: Number(price),
        category,
        images: images || [],
        sizes: sizes || [],
        colors: colors || [],
        in_stock: in_stock !== undefined ? in_stock : true,
        created_at: new Date().toISOString()
      };
      mockProducts.unshift(newProduct);
      res.status(201).json(newProduct);
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name_en,
          name_fr,
          description_en,
          description_fr,
          price: Number(price),
          category,
          images: images || [],
          sizes: sizes || [],
          colors: colors || [],
          in_stock: in_stock !== undefined ? in_stock : true
        }
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id - Admin only
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name_en,
      name_fr,
      description_en,
      description_fr,
      price,
      category,
      images,
      sizes,
      colors,
      in_stock
    } = req.body;

    if (!name_en || !name_fr || price === undefined) {
      res.status(400).json({ error: 'Name (EN/FR) and Price are required' });
      return;
    }

    if (isPlaceholder) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      const updatedProduct = {
        ...mockProducts[index],
        name_en,
        name_fr,
        description_en,
        description_fr,
        price: Number(price),
        category,
        images: images || [],
        sizes: sizes || [],
        colors: colors || [],
        in_stock: in_stock !== undefined ? in_stock : true
      };
      mockProducts[index] = updatedProduct;
      res.json(updatedProduct);
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        name_en,
        name_fr,
        description_en,
        description_fr,
        price: Number(price),
        category,
        images: images || [],
        sizes: sizes || [],
        colors: colors || [],
        in_stock: in_stock !== undefined ? in_stock : true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id - Admin only
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isPlaceholder) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      mockProducts = mockProducts.filter(p => p.id !== id);
      res.json({ message: 'Product deleted successfully' });
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/products/:id/stock - Admin only (toggle stock status)
router.patch('/:id/stock', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isPlaceholder) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      mockProducts[index].in_stock = !mockProducts[index].in_stock;
      res.json(mockProducts[index]);
      return;
    }
    
    // First, fetch the current stock status
    const { data: current, error: fetchError } = await supabase
      .from('products')
      .select('in_stock')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .update({ in_stock: !current.in_stock })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
