import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Projects from './pages/Projects'
import HumanResources from './pages/HumanResources'
import NewWorker from './pages/hr/NewWorker'
import NewContract from './pages/hr/NewContract'
import RegisterPayment from './pages/hr/RegisterPayment'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<Projects />} />
          <Route path="hr" element={<HumanResources />} />
          <Route path="hr/new-worker"       element={<NewWorker />} />
          <Route path="hr/new-contract"     element={<NewContract />} />
          <Route path="hr/register-payment" element={<RegisterPayment />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}