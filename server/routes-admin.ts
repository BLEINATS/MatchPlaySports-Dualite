import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { storage } from "./storage-db";
import { adminOnly } from "./middleware/tenant-auth-simple";
import { 
  insertCourtSchema, 
  insertUserSchema,
  type Tenant,
  type User,
  type Court,
  type Partner
} from "@shared/schema";

const router = Router();

// ===== 1. DASHBOARD E MÉTRICAS ESPECÍFICAS DO TENANT =====

router.get('/dashboard/stats', adminOnly, async (req: Request, res: Response) => {
  try {
    const tenantId = req.activeTenantId || (req as any).tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID required" });
    }

    // Mock stats for now - these would come from actual database queries
    const stats = {
      totalCourts: 0,
      totalUsers: 0,
      totalBookings: 0,
      monthlyRevenue: 0,
      todayBookings: 0,
      activeUsers: 0,
      statusStats: {
        confirmed: 0,
        pending: 0,
        cancelled: 0
      },
      upcomingEvents: [],
      eventTypeStats: []
    };

    // Get courts count for this tenant
    const courts = await storage.getCourtsByTenant(tenantId);
    stats.totalCourts = courts.length;

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
});

// ===== 2. GESTÃO DE QUADRAS ESPECÍFICAS DO TENANT =====

router.get('/courts', adminOnly, async (req: Request, res: Response) => {
  try {
    const tenantId = req.activeTenantId || (req as any).tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID required" });
    }

    const courts = await storage.getCourtsByTenant(tenantId);
    res.json(courts);
  } catch (error) {
    console.error('Get courts error:', error);
    res.status(500).json({ message: "Error fetching courts" });
  }
});

router.post('/courts', adminOnly, async (req: Request, res: Response) => {
  try {
    const tenantId = req.activeTenantId || (req as any).tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID required" });
    }

    const validation = insertCourtSchema.safeParse({
      ...req.body,
      tenantId
    });

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid court data",
        errors: validation.error.issues
      });
    }

    const court = await storage.createCourt(validation.data);
    res.status(201).json(court);
  } catch (error) {
    console.error('Create court error:', error);
    res.status(500).json({ message: "Error creating court" });
  }
});

router.patch('/courts/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const tenantId = req.activeTenantId || (req as any).tenantId;
    const courtId = Number(req.params.id);
    
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID required" });
    }

    if (isNaN(courtId)) {
      return res.status(400).json({ message: "Invalid court ID" });
    }

    // Verify court belongs to tenant
    const existingCourt = await storage.getCourt(courtId);
    if (!existingCourt || existingCourt.tenantId !== tenantId) {
      return res.status(404).json({ message: "Court not found" });
    }

    const updatedCourt = await storage.updateCourt(courtId, req.body);
    res.json(updatedCourt);
  } catch (error) {
    console.error('Update court error:', error);
    res.status(500).json({ message: "Error updating court" });
  }
});

router.delete('/courts/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const tenantId = req.activeTenantId || (req as any).tenantId;
    const courtId = Number(req.params.id);
    
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID required" });
    }

    if (isNaN(courtId)) {
      return res.status(400).json({ message: "Invalid court ID" });
    }

    // Verify court belongs to tenant
    const existingCourt = await storage.getCourt(courtId);
    if (!existingCourt || existingCourt.tenantId !== tenantId) {
      return res.status(404).json({ message: "Court not found" });
    }

    await storage.deleteCourt(courtId);
    res.json({ message: "Court deleted successfully" });
  } catch (error) {
    console.error('Delete court error:', error);
    res.status(500).json({ message: "Error deleting court" });
  }
});

// ===== 3. GESTÃO DE RESERVAS ESPECÍFICAS DO TENANT =====

router.get('/reservations/:courtId?', adminOnly, async (req: Request, res: Response) => {
  try {
    const tenantId = req.activeTenantId || (req as any).tenantId;
    const courtId = req.params.courtId ? Number(req.params.courtId) : undefined;
    
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID required" });
    }

    const bookings = await storage.getReservationsByTenant(tenantId);
    res.json(bookings);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: "Error fetching reservations" });
  }
});

export default router;