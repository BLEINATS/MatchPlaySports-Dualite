import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import connectPgSimple from "connect-pg-simple";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { pool } from "./db";
import mainRouter from "./src/routes/index";
import adminRouter from "./routes-admin";
import { teacherRoutes } from "./routes-teacher";
import clientRoutes from "./routes-client";
import { registerPublicRoutes } from "./routes-public";
import { rentalPlayerRoutes } from "./routes-rental-player";
import playersForHireRoutes from "./routes-players-for-hire";
import whatsappRoutes from "./whatsapp-service";
import brandRoutes from "./routes-brand";
import { registerPartnerRoutes } from "./routes-partners";
import tenantSelectionRoutes from "./routes-tenant-selection";
import testAuthRoutes from "./routes-test-auth";
import superAdminRoutes from "./routes-superadmin-simple";
import superAdminCompleteRouter from "./routes-superadmin-complete";
import pricingRoutes from "./routes-pricing-fixed";
import eventRoutes from "./routes-events";
import defaultPricingRoutes from "./routes-default-pricing";
import loyaltyRoutes from "./routes-loyalty";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { whatsappService } from "./services/whatsapp";
import { publicRoute, adminOnly, teacherAccess, clientAccess, rentalPlayerAccess } from "./middleware/tenant-auth-simple";

const app = express();

// Configure CORS to allow credentials from frontend
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Check if origin ends with .replit.dev or .replit.app for production
    if (origin.includes('.replit.dev') || origin.includes('.replit.app')) {
      return callback(null, true);
    }
    
    // For development environment, allow all origins
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'X-Tenant-ID'],
  exposedHeaders: ['Set-Cookie']
}));

// Skip JSON parsing for upload routes to avoid FormData conflicts
app.use((req, res, next) => {
  if (req.path.includes('/upload')) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Configure sessions with PostgreSQL store
const PgSession = connectPgSimple(session);

// Configure session with environment-appropriate settings
const isProduction = process.env.NODE_ENV === 'production';
const isReplit = process.env.REPLIT_DEPLOYMENT !== undefined || process.env.REPL_ID !== undefined;

// Dynamic cookie configuration based on environment
const cookieConfig = {
  secure: isReplit, // True for Replit HTTPS environment
  httpOnly: true, // Secure HTTP-only cookies for session security
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: isReplit ? 'none' as 'none' : 'lax' as 'lax', // None for cross-origin, lax for same-origin
  path: '/',
  domain: undefined // Let browser determine domain
};

console.log('🍪 Cookie configuration:', {
  isProduction,
  isReplit,
  secure: cookieConfig.secure,
  sameSite: cookieConfig.sameSite
});

app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: 'matchplay-secret-key-development-super-secret-2025',
  resave: false,
  saveUninitialized: true, // Force session creation to send cookie
  rolling: false,
  name: 'matchplay.session',
  cookie: cookieConfig
}));

// Force session initialization for all requests
app.use((req, res, next) => {
  if (!req.session) {
    console.log('⚠️ No session found, creating new one');
    req.session = {} as any;
  }
  next();
});

// JWT Authentication middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matchplay-jwt-secret-key-2025') as any;
      (req as any).jwtUserId = decoded.userId;
      (req as any).jwtUserRole = decoded.userRole;
      (req as any).jwtTenantId = decoded.tenantId;
      console.log('✅ JWT Auth successful:', { 
        userId: decoded.userId, 
        role: decoded.userRole, 
        tenantId: decoded.tenantId,
        stored: {
          jwtUserId: (req as any).jwtUserId,
          jwtUserRole: (req as any).jwtUserRole,
          jwtTenantId: (req as any).jwtTenantId
        }
      });
    } catch (error) {
      console.log('❌ JWT Auth failed:', (error as Error).message);
    }
  }
  
  next();
});

// Enhanced middleware for session debugging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log('🔍 Enhanced Session Debug:', {
      path: req.path,
      method: req.method,
      jwtUserId: (req as any).jwtUserId,
      jwtUserRole: (req as any).jwtUserRole,
      jwtTenantId: (req as any).jwtTenantId,
      authHeader: req.headers.authorization ? 'Bearer [token]' : 'none',
      sessionId: req.sessionID,
      hasSession: !!req.session,
      sessionUserId: (req.session as any)?.userId,
      cookieHeader: req.headers.cookie,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Registrar rotas principais usando novo sistema MVC
  app.use(mainRouter);
  
  // Create HTTP server
  const server = createServer(app);
  
  // Registrar rotas públicas (sem autenticação)
  registerPublicRoutes(app);
  
  // Registrar rotas de seleção de tenant (requer autenticação básica)
  app.use('/api/tenant', tenantSelectionRoutes);
  
  // Registrar rotas de teste de autenticação (para desenvolvimento)
  app.use('/api/test-auth', testAuthRoutes);
  
  // CRITICAL: Add public tenant registration route BEFORE adminOnly middleware
  app.post('/api/admin/tenants', async (req, res, next) => {
    try {
      const authController = await import('./src/controllers/auth.controller');
      return authController.createTenant(req, res);
    } catch (error) {
      console.error('Error loading auth controller:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Registrar rotas de administrador (com middleware de autorização)
  app.use('/api/admin', adminOnly, adminRouter);
  
  // Registrar rotas de super administrador
  app.use('/api/superadmin', superAdminCompleteRouter);
  
  // Registrar rotas de professor (com middleware de autorização)
  app.use('/api/teacher', teacherAccess, teacherRoutes);
  
  // Registrar rotas de cliente (com middleware de autorização)
  app.use('/api/client', clientAccess, clientRoutes);
  
  // Registrar rotas de jogador de aluguel (com middleware de autorização)
  app.use('/api/rental-player', rentalPlayerAccess, rentalPlayerRoutes);
  
  // Registrar rotas de gestão de jogadores para aluguel (com middleware de admin)
  app.use('/api/players-for-hire', adminOnly, playersForHireRoutes);
  
  // Registrar rotas de WhatsApp (com middleware de admin)
  app.use('/api/whatsapp', adminOnly, whatsappRoutes);

  // Registrar rotas de personalização da marca (com middleware de admin)
  app.use('/api/brand', adminOnly, brandRoutes);

  // Registrar rotas de gestão de preços (com middleware de admin)
  app.use('/api/pricing', adminOnly, pricingRoutes);

  // Registrar rotas de eventos (com middleware de admin)
  app.use('/api/events', adminOnly, eventRoutes);

  // Registrar rotas de configuração de preços padrão (com middleware de admin)
  app.use('/api/default-pricing', adminOnly, defaultPricingRoutes);

  // Registrar rotas de programa de fidelidade (com middleware de admin)
  app.use('/api', adminOnly, loyaltyRoutes);

  // Registrar rotas de parceiros e patrocinadores (com middleware de admin)
  registerPartnerRoutes(app);

  // Registrar rotas de Super Admin (sem middleware de tenant)
  app.use('/api/superadmin', publicRoute, superAdminRoutes);

  // Middleware de 404 apenas para rotas de API (ANTES do Vite)
  app.use('/api', notFoundHandler);

  // Setup Vite AFTER API routes so API takes precedence
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler
  app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
