module.exports = {
    apps: [
        {
            name: "tenant-a-backend",
            script: "node",
            args: "node_modules/json-server/lib/bin.js data/db.json --port 4001",
            env: {
                PORT: 4001
            }
        },
        {
            name: "tenant-a-frontend",
            script: "npm",
            args: "run dev -- --port 3001",
            env: {
                VITE_API_URL: "http://localhost:4001"
            }
        },
        {
            name: "tenant-b-backend",
            script: "node",
            args: "node_modules/json-server/lib/bin.js data/db.json --port 4002",
            env: {
                PORT: 4002
            }
        },
        {
            name: "tenant-b-frontend",
            script: "npm",
            args: "run dev -- --port 3002",
            env: {
                VITE_API_URL: "http://localhost:4002"
            }
        },
        {
            name: "tenant-company-SMT-backend",
            script: "node",
            args: "node_modules/json-server/lib/bin.js data/db-smt.json --port 4005",
            env: {
                PORT: 4005
            }
        },
        {
            name: "tenant-company-SMT-frontend",
            script: "npm",
            args: "run dev -- --port 3005",
            env: {
                VITE_API_URL: "http://localhost:4005",
                VITE_COMPANY_NAME: "SMT Factory",
                VITE_LOGO_URL: "/smt-logo.png"
            }
        }]
};
