
```
Proyecto_silver
├─ .continue
│  └─ agents
│     └─ new-config.yaml
├─ .dockerignore
├─ backend
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  └─ schema.prisma
│  ├─ src
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  └─ authMiddleware.ts
│  │  ├─ routes
│  │  │  ├─ auth.ts
│  │  │  ├─ companies.ts
│  │  │  ├─ contracts.ts
│  │  │  ├─ expenses.ts
│  │  │  ├─ locals.ts
│  │  │  ├─ payments.ts
│  │  │  ├─ projects.ts
│  │  │  ├─ routes.ts
│  │  │  ├─ upload.ts
│  │  │  └─ workers.ts
│  │  └─ utils
│  │     └─ prisma.ts
│  └─ tsconfig.json
├─ docker-compose.yml
├─ Dockerfile
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ logo1.png
│  │  ├─ vite.svg
│  │  └─ _redirects
│  ├─ README.md
│  ├─ src
│  │  ├─ App.tsx
│  │  ├─ components
│  │  │  ├─ Layout.tsx
│  │  │  └─ ui
│  │  │     ├─ Button.tsx
│  │  │     ├─ ExportModal.tsx
│  │  │     ├─ FormField.tsx
│  │  │     ├─ Input.tsx
│  │  │     ├─ Select.tsx
│  │  │     └─ StepIndicator.tsx
│  │  ├─ config.ts
│  │  ├─ index.css
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ Expenses.tsx
│  │  │  ├─ hr
│  │  │  │  ├─ components
│  │  │  │  │  └─ PaymentRow.tsx
│  │  │  │  ├─ hrConstants.ts
│  │  │  │  ├─ hrTypes.ts
│  │  │  │  ├─ modals
│  │  │  │  │  ├─ EditCompanyModal.tsx
│  │  │  │  │  ├─ EditContractModal.tsx
│  │  │  │  │  └─ EditWorkerModal.tsx
│  │  │  │  ├─ NewContract.tsx
│  │  │  │  ├─ NewWorker.tsx
│  │  │  │  └─ RegisterPayment.tsx
│  │  │  ├─ HumanResources.tsx
│  │  │  ├─ Login.tsx
│  │  │  ├─ projects
│  │  │  │  ├─ components
│  │  │  │  │  ├─ AnalyticsView.tsx
│  │  │  │  │  ├─ ProjectCard.tsx
│  │  │  │  │  └─ StatCard.tsx
│  │  │  │  ├─ modals
│  │  │  │  │  ├─ AssignModal.tsx
│  │  │  │  │  ├─ EditProjectModal.tsx
│  │  │  │  │  ├─ NewProjectForm.tsx
│  │  │  │  │  ├─ ProjectDetailModal.tsx
│  │  │  │  │  └─ RoutesModal.tsx
│  │  │  │  ├─ projectConstants.ts
│  │  │  │  └─ projectTypes.ts
│  │  │  └─ Projects.tsx
│  │  ├─ services
│  │  │  ├─ api.ts
│  │  │  ├─ authService.ts
│  │  │  ├─ companyService.ts
│  │  │  ├─ contractService.ts
│  │  │  ├─ expenseService.ts
│  │  │  ├─ localService.ts
│  │  │  ├─ paymentService.ts
│  │  │  ├─ projectService.ts
│  │  │  ├─ routeService.ts
│  │  │  └─ workerService.ts
│  │  └─ utils
│  │     └─ exportExcel.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ icon-192.jpg
├─ icon-512.jpg
└─ render.yaml

```