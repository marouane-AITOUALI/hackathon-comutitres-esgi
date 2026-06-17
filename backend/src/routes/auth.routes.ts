import { Router } from 'express'
import { login, logout, me, register, registerWithOnboarding, updateMe } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validate.js'
import { loginSchema, registerSchema, registerWithOnboardingSchema, updateCurrentUserSchema } from '../validation/auth.schemas.js'
export const authRouter = Router()
authRouter.post('/register', validateBody(registerSchema), register)
authRouter.post('/register-with-onboarding', validateBody(registerWithOnboardingSchema), registerWithOnboarding)
authRouter.post('/login', validateBody(loginSchema), login)
authRouter.post('/logout', logout)
authRouter.get('/me', authMiddleware, me)
authRouter.patch('/me', authMiddleware, validateBody(updateCurrentUserSchema), updateMe)
