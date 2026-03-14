import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'silverstar_secret_key'

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    console.error('ERROR LOGIN:', error)
    res.status(500).json({ error: 'Error during login' })
  }
})

// POST /api/auth/register (solo para crear el primer usuario)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password and name are required' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, password: hashed, name }
    })

    res.status(201).json({ id: user.id, email: user.email, name: user.name })
  } catch (error) {
    console.error('ERROR REGISTER:', error)
    res.status(500).json({ error: 'Error creating user' })
  }
})

// PUT /api/auth/change-password
router.put('/change-password', async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    const authHeader = req.headers.authorization
    if (!authHeader) { res.status(401).json({ error: 'No token' }); return }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as any

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) { res.status(404).json({ error: 'User not found' }); return }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('ERROR CHANGE PASSWORD:', error)
    res.status(500).json({ error: 'Error changing password' })
  }
})

export default router