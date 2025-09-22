// admin-panel/app/(auth)/register/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Phone,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Sun,
  Moon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/phone-utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'admin' as 'admin' | 'moderator'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', newMode.toString())
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        // 1. Validasi Input (Tetap sama, ini praktik yang baik)
        if (formData.password !== formData.confirmPassword) {
        setError('Password dan konfirmasi password tidak cocok.');
        setLoading(false);
        return;
        }
        if (!validatePhoneNumber(formData.phone)) {
        setError('Format nomor telepon tidak valid.');
        setLoading(false);
        return;
        }
        // Validasi lain bisa ditambahkan di sini...

        try {
        const formattedPhone = formatPhoneNumber(formData.phone);

        // 2. (Opsional tapi direkomendasikan) Cek keunikan nomor telepon
        const { data: phoneCheck, error: phoneError } = await supabase
            .from('users')
            .select('id')
            .eq('phone', formattedPhone)
            .maybeSingle();

        if (phoneError) throw phoneError;
        if (phoneCheck) {
            throw new Error('Nomor telepon sudah terdaftar.');
        }
        
        // 3. Panggil supabase.auth.signUp dan biarkan Supabase melakukan sisanya
        // Trigger di database akan otomatis membuat profil di tabel 'users'
        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                 full_name: formData.name,
                 phone: formData.phone,
                }
            }
            });

        if (error) {
            // Tangani error spesifik dari Supabase
            if (error.message.includes('already registered')) {
            throw new Error('Email sudah terdaftar. Silakan coba login.');
            }
            throw error;
        }        
        // Handle jika user butuh verifikasi email tapi fitur dimatikan
        if (data.user && data.user.identities?.length === 0) {
            setError("Error: Pengguna ini sudah ada. Silakan coba login.");
            setLoading(false);
            return;
        }
        
        console.log('Registrasi berhasil, user:', data.user);
        setSuccess(true);

        // Arahkan ke halaman login atau halaman "cek email"
        setTimeout(() => {
            router.push('/login');
        }, 3000);

        } catch (error: any) {
        console.error('Registration error:', error);
        setError(error.message || 'Gagal membuat akun. Silakan coba lagi.');
        } finally {
        setLoading(false);
        }
    };

  return (
    <div className="w-full max-w-md">
      {/* Dark Mode Toggle */}
      <div className="absolute top-6 right-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className="h-10 w-10 p-0 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg"
            >
              <UserPlus className="h-8 w-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Registrasi Akun
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-400 mt-2"
            >
              Buat akun baru untuk Fasumku
            </motion.p>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Registrasi berhasil! Silakan cek email untuk verifikasi. Mengalihkan ke halaman login...
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg",
                    "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                    "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 focus:outline-none",
                    "transition-colors"
                  )}
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={loading || success}
                />
              </div>
            </motion.div>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg",
                    "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                    "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 focus:outline-none",
                    "transition-colors"
                  )}
                  placeholder="email@example.com"
                  required
                  disabled={loading || success}
                />
              </div>
            </motion.div>

            {/* Phone Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nomor Telepon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg",
                    "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                    "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 focus:outline-none",
                    "transition-colors"
                  )}
                  placeholder="08123456789"
                  required
                  disabled={loading || success}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format: 08xxx, 628xxx, atau +628xxx
              </p>
            </motion.div>

            {/* Role Field */}
            {/* <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 }}
            >
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipe Akun
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' | 'moderator' })}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg",
                    "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                    "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 focus:outline-none",
                    "transition-colors"
                  )}
                  disabled={loading || success}
                >
                  <option value="user">User Biasa</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </motion.div> */}

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    "w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg",
                    "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                    "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 focus:outline-none",
                    "transition-colors"
                  )}
                  placeholder="Minimal 6 karakter"
                  required
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={loading || success}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 }}
            >
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={cn(
                    "w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg",
                    "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                    "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 focus:outline-none",
                    "transition-colors"
                  )}
                  placeholder="Masukkan ulang password"
                  required
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={loading || success}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                    Mendaftarkan...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Registrasi Berhasil!
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Daftar
                  </>
                )}
              </Button>
            </motion.div>

            {/* Login Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="text-center"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Masuk di sini
                </Link>
              </p>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Data Anda aman dan terenkripsi
            </div>
          </motion.div>
        </Card>
      </motion.div>

      {/* Footer Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400"
      >
        © 2024 Fasumku. Sistem Pelaporan Fasilitas Umum
      </motion.p>
    </div>
  )
}