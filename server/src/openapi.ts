import { OpenApiGeneratorV3, OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const requestStatusValues = ['Open', 'Closed', 'Approved', 'Rejected', 'OnHold', 'InReview'] as const;
const priorityValues = ['Low', 'Medium', 'High', 'Urgent'] as const;

const RequestSchema = z.object({
  id: z.number().int(),
  orderNo: z.string(),
  title: z.string().nullable(),
  department: z.string().nullable(),
  vendor: z.string().nullable(),
  priority: z.enum(priorityValues),
  status: z.enum(requestStatusValues),
  quantity: z.number().int().nullable(),
  requiredDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const RequestListResponse = z.array(RequestSchema);

const KpisSchema = z.object({
  total: z.number().int(),
  open: z.number().int(),
  closed: z.number().int(),
  approved: z.number().int(),
  rejected: z.number().int(),
  onHold: z.number().int(),
  inReview: z.number().int(),
});

const VendorSummarySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  status: z.string(),
  category: z.string(),
  createdAt: z.string().datetime(),
});

const VendorsKpisSchema = z.object({
  total: z.number().int(),
  active: z.number().int(),
  onHold: z.number().int(),
  newThisMonth: z.number().int(),
  totalSpend: z.number(),
});

const VendorsAnalyticsSchema = z.object({
  byStatus: z.array(z.object({ status: z.string(), count: z.number().int() })),
  byCategory: z.array(z.object({ category: z.string(), count: z.number().int() })),
  spendByVendor: z.array(z.object({ vendorId: z.number().int(), total: z.number() })),
  ratingAvg: z.number().nullable(),
});

const RequestsOverviewKpisSchema = z.object({
  total: z.number().int(),
  open: z.number().int(),
  closed: z.number().int(),
  approved: z.number().int(),
  rejected: z.number().int(),
});

const InventoryKpisSchema = z.object({
  lowStock: z.number().int(),
  outOfStock: z.number().int(),
  inventoryValue: z.number(),
  totalItems: z.number().int(),
});

const FleetKpisSchema = z.object({
  total: z.number().int(),
  inOperation: z.number().int(),
  underMaintenance: z.number().int(),
  totalDistance: z.number(),
});

const FleetAnalyticsSchema = z.object({
  statusDistribution: z.array(z.object({ status: z.string(), count: z.number().int() })),
  departmentUsage: z.array(z.object({ department: z.string(), count: z.number().int() })),
  maintenanceTrend: z.array(z.object({ month: z.string(), events: z.number().int(), cost: z.number() })),
});

const OverviewKpisSchema = z.object({
  requests: RequestsOverviewKpisSchema,
  inventory: InventoryKpisSchema,
  vendors: VendorsKpisSchema,
  fleet: FleetKpisSchema,
});

const CreateRequestPayloadSchema = z.object({
  orderNo: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  department: z.string().optional(),
  vendorName: z.string().optional(),
  priority: z.string().optional(),
  requiredDate: z.string().datetime().optional(),
  items: z.array(z.object({ code: z.string().optional(), name: z.string().optional(), qty: z.number().optional(), unit: z.string().optional() })).optional(),
});

const CreateOrderPayloadSchema = z.object({
  orderNo: z.string().optional(),
  requestId: z.number().int().optional(),
  vendorId: z.number().int().optional(),
  vendorName: z.string().optional(),
  amount: z.number().optional(),
  status: z.string().optional(),
  currency: z.string().optional(),
  expectedDelivery: z.string().datetime().optional(),
});

registry.register('Request', RequestSchema);
registry.register('RequestListResponse', RequestListResponse);
registry.register('RequestKpis', KpisSchema);

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Service health status',
  responses: {
    200: {
      description: 'Healthy',
      content: {
        'application/json': {
          schema: z.object({ status: z.literal('ok'), version: z.string() }).openapi('HealthResponse'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/requests',
  summary: 'List procurement requests',
  responses: {
    200: {
      description: 'List of requests',
      content: {
        'application/json': {
          schema: RequestListResponse,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/requests',
  summary: 'Create a new request',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateRequestPayloadSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created request',
      content: {
        'application/json': {
          schema: RequestSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/requests/kpis',
  summary: 'High level KPI metrics for requests',
  responses: {
    200: {
      description: 'KPIs computed from requests',
      content: {
        'application/json': {
          schema: KpisSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/orders',
  summary: 'List purchase orders',
  responses: {
    200: {
      description: 'Orders',
      content: {
        'application/json': {
          schema: z.array(z.object({
            id: z.number().int(),
            orderNo: z.string(),
            status: z.string(),
            totalValue: z.number().nullable(),
            currency: z.string().nullable(),
            expectedDelivery: z.string().datetime().nullable(),
            createdAt: z.string().datetime(),
          })).openapi('OrderListResponse'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/orders',
  summary: 'Create a purchase order',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateOrderPayloadSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created order',
      content: {
        'application/json': {
          schema: z.object({ id: z.number().int(), orderNo: z.string() }).passthrough(),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/vendors',
  summary: 'List vendors',
  responses: {
    200: {
      description: 'Vendors',
      content: {
        'application/json': {
          schema: z.array(VendorSummarySchema).openapi('VendorListResponse'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/vendors/kpis',
  summary: 'Vendor KPI rollups',
  responses: {
    200: {
      description: 'Aggregated vendor metrics',
      content: {
        'application/json': {
          schema: VendorsKpisSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/vendors/analytics',
  summary: 'Vendor analytics breakdowns',
  responses: {
    200: {
      description: 'Analytics',
      content: {
        'application/json': {
          schema: VendorsAnalyticsSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inventory/items',
  summary: 'List inventory items',
  responses: {
    200: {
      description: 'Inventory items',
      content: {
        'application/json': {
          schema: z.array(z.object({
            id: z.number().int(),
            name: z.string(),
            qtyOnHand: z.number().int().nullable(),
            reorderPoint: z.number().int().nullable(),
          })).openapi('InventoryItemList'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inventory/movements',
  summary: 'List inventory movements',
  responses: {
    200: {
      description: 'Recent stock movements',
      content: {
        'application/json': {
          schema: z.array(z.object({ id: z.number().int(), moveType: z.string(), qty: z.number().int().nullable(), createdAt: z.string().datetime() })).openapi('InventoryMovementList'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inventory/kpis',
  summary: 'Inventory KPI rollups',
  responses: {
    200: {
      description: 'Aggregated inventory metrics',
      content: {
        'application/json': {
          schema: InventoryKpisSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/fleet/maintenance',
  summary: 'Recent maintenance records',
  responses: {
    200: {
      description: 'Maintenance',
      content: {
        'application/json': {
          schema: z.array(z.object({ id: z.number().int(), type: z.string(), date: z.string().datetime() })).openapi('FleetMaintenanceResponse'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/fleet/vehicles',
  summary: 'List fleet vehicles',
  responses: {
    200: {
      description: 'Fleet vehicles',
      content: {
        'application/json': {
          schema: z.array(z.object({ id: z.number().int(), plateNo: z.string(), status: z.string().nullable() })).openapi('FleetVehiclesResponse'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/fleet/kpis',
  summary: 'Fleet KPI rollups',
  responses: {
    200: {
      description: 'Fleet KPIs',
      content: {
        'application/json': {
          schema: FleetKpisSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/fleet/analytics',
  summary: 'Fleet analytics',
  responses: {
    200: {
      description: 'Fleet analytics datasets',
      content: {
        'application/json': {
          schema: FleetAnalyticsSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/rfq/send',
  summary: 'Send RFQ to vendor',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            requestId: z.number().int(),
            vendorId: z.number().int(),
            contactEmail: z.string().email().optional(),
            contactName: z.string().optional(),
            message: z.string().optional(),
          }).openapi('SendRfqPayload'),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'RFQ created',
      content: {
        'application/json': {
          schema: z.object({ id: z.number().int(), status: z.string() }).openapi('SendRfqResponse'),
        },
      },
    },
    409: {
      description: 'Duplicate RFQ for request/vendor pair',
      content: {
        'application/json': {
          schema: z.object({ error: z.string(), status: z.literal(409) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/overview/kpis',
  summary: 'Overview KPI snapshot',
  responses: {
    200: {
      description: 'Aggregated KPI totals',
      content: {
        'application/json': {
          schema: OverviewKpisSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/overview/charts',
  summary: 'Overview charts datasets',
  responses: {
    200: {
      description: 'Overview chart data',
      content: {
        'application/json': {
          schema: z.object({ datasets: z.array(z.unknown()) }),
        },
      },
    },
  },
});

export const buildOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'NCS Platform API',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT ?? 4000}`,
      },
    ],
  });
};
