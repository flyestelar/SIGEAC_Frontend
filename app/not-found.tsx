'use client'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Plane } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {

  const { user } = useAuth()

  return (
    <div className='h-dvh w-dvw flex flex-col items-center justify-center'>
      <div className='flex flex-col justify-center items-center max-w-xl gap-y-4'>
        <Plane className='size-[110px]' />
        <h1 className='font-bold text-7xl text-center'>¡No Encontrado!</h1>
        <p className='text-lg text-muted-foreground text-center'>Lo sentimos, pero la página que estabas buscando no pudo ser localizada. Es posible que se haya movido o ya no exista.</p>
        <Link href={user?.companies[0].name === 'transmandu' ? '/transmandu/dashboard' : "/estelar/dashboard"}>
          <Button className='bg-black text-white hover:bg-transparent hover:text-black hover:border hover:border-black'>Regresar</Button>
        </Link>
      </div>
    </div>
  )
}
