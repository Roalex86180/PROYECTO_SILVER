
```
Proyecto_silver
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
│  │  │  ├─ payments.ts
│  │  │  ├─ projects.ts
│  │  │  ├─ upload.ts
│  │  │  └─ workers.ts
│  │  └─ utils
│  │     └─ prisma.ts
│  └─ tsconfig.json
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
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
│  │  ├─ index.css
│  │  ├─ main.tsx
│  │  ├─ pages
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
│  │  │  │  │  ├─ EditProjectModal.tsx
│  │  │  │  │  ├─ NewProjectForm.tsx
│  │  │  │  │  └─ ProjectDetailModal.tsx
│  │  │  │  ├─ projectConstants.ts
│  │  │  │  └─ projectTypes.ts
│  │  │  └─ Projects.tsx
│  │  ├─ services
│  │  │  ├─ api.ts
│  │  │  ├─ authService.ts
│  │  │  ├─ companyService.ts
│  │  │  ├─ contractService.ts
│  │  │  ├─ paymentService.ts
│  │  │  ├─ projectService.ts
│  │  │  └─ workerService.ts
│  │  └─ utils
│  │     └─ exportExcel.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
└─ render.yaml

```