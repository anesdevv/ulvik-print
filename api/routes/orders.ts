import { Router, Response } from 'express';
import { supabase, isPlaceholder } from '../lib/supabase.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/requireAdmin.js';

const router = Router();

// In-memory mock orders fallback dataset
let mockOrders: any[] = [
  {
    id: "dev-ord-001",
    created_at: new Date().toISOString(),
    product_id: "dev-p1",
    product_name: "T-shirt Classic Black",
    size: "M",
    color: "Noir / Black",
    customer_name: "Abdelkader Rahmouni",
    phone: "0550123456",
    wilaya: "13 - Tlemcen",
    baladiya: "Maghnia",
    delivery_type: "home",
    delivery_fee: 800,
    total_price: 3300,
    status: "new"
  },
  {
    id: "dev-ord-002",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    product_id: "dev-p2",
    product_name: "T-shirt Vintage Green",
    size: "L",
    color: "Vert / Green",
    customer_name: "Yassine Belkacem",
    phone: "0770987654",
    wilaya: "16 - Alger",
    baladiya: "Alger Centre",
    delivery_type: "desk",
    delivery_fee: 0,
    total_price: 2900,
    status: "confirmed"
  },
  {
    id: "dev-ord-003",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    product_id: "dev-p1",
    product_name: "T-shirt Classic Black",
    size: "XL",
    color: "Blanc / White",
    customer_name: "Mustapha Benali",
    phone: "0661223344",
    wilaya: "31 - Oran",
    baladiya: "Sidi Chami",
    delivery_type: "home",
    delivery_fee: 700,
    total_price: 3200,
    status: "delivered"
  }
];

// POST /api/orders - Public (Place new order)
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      product_id,
      product_name,
      size,
      color,
      customer_name,
      phone,
      wilaya,
      baladiya,
      delivery_type,
      delivery_fee,
      total_price
    } = req.body;

    // Validate request body
    if (
      !product_name ||
      !size ||
      !color ||
      !customer_name ||
      !phone ||
      !wilaya ||
      !baladiya ||
      !delivery_type ||
      total_price === undefined
    ) {
      res.status(400).json({ error: 'Missing required order fields' });
      return;
    }

    if (isPlaceholder) {
      const newOrder = {
        id: `dev-ord-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString(),
        product_id: product_id || null,
        product_name,
        size,
        color,
        customer_name,
        phone,
        wilaya,
        baladiya,
        delivery_type,
        delivery_fee: Number(delivery_fee) || 0,
        total_price: Number(total_price),
        status: 'new'
      };
      mockOrders.unshift(newOrder);
      res.status(201).json(newOrder);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          product_id: product_id || null,
          product_name,
          size,
          color,
          customer_name,
          phone,
          wilaya,
          baladiya,
          delivery_type,
          delivery_fee: Number(delivery_fee) || 0,
          total_price: Number(total_price),
          status: 'new' // default
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

// GET /api/orders - Admin only (List filterable orders)
// Query params: status, wilaya, from, to (dates), page, limit
router.get('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, wilaya, from, to, page, limit } = req.query;

    if (isPlaceholder) {
      let filtered = [...mockOrders];

      if (status) {
        filtered = filtered.filter(o => o.status === status);
      }
      if (wilaya) {
        filtered = filtered.filter(o => o.wilaya === wilaya);
      }
      if (from) {
        filtered = filtered.filter(o => o.created_at >= (from as string));
      }
      if (to) {
        let toStr = to as string;
        if (toStr.length === 10) {
          toStr = `${toStr}T23:59:59.999Z`;
        }
        filtered = filtered.filter(o => o.created_at <= toStr);
      }

      // Sort by date desc
      filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));

      const count = filtered.length;
      let paginated = filtered;

      if (page && limit) {
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const start = (pageNum - 1) * limitNum;
        paginated = filtered.slice(start, start + limitNum);
      }

      res.json({
        orders: paginated,
        count,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : count
      });
      return;
    }

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (wilaya) {
      query = query.eq('wilaya', wilaya);
    }
    if (from) {
      query = query.gte('created_at', from as string);
    }
    if (to) {
      let toStr = to as string;
      if (toStr.length === 10) {
        toStr = `${toStr}T23:59:59.999Z`;
      }
      query = query.lte('created_at', toStr);
    }

    query = query.order('created_at', { ascending: false });

    // Handle pagination if provided
    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const fromIdx = (pageNum - 1) * limitNum;
      const toIdx = fromIdx + limitNum - 1;
      query = query.range(fromIdx, toIdx);
    }

    const { data, count, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      orders: data,
      count: count || 0,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : (count || 0)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status - Admin only (Update order status)
router.patch('/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    if (isPlaceholder) {
      const index = mockOrders.findIndex(o => o.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      mockOrders[index].status = status;
      res.json(mockOrders[index]);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
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
