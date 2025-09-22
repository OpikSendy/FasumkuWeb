// components/LogoutButton.tsx
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const { logout } = useAuth()

  return (
    <Button
      onClick={logout}
      variant="ghost"
      size="sm"
      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
    >
      <LogOut className="h-4 w-4" />
      Keluar
    </Button>
  )
}