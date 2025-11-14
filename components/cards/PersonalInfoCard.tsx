'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import { User } from "@/types"

const PersonalInfoCard = ({ user }: { user: User }) => {
  // Protegemos campos opcionales con valores por defecto
  const firstName = user.first_name ?? "-"
  const lastName = user.last_name ?? "-"
  const username = user.username ?? "-"
  const email = user.email ?? "-"
  const isActive = user.isActive ?? true // valor por defecto false

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Básica</CardTitle>
        <CardDescription>
          Resumen personal de {firstName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex justify-around gap-2">
          <div className="flex gap-2">
            <h3 className="text-muted-foreground">Nombre:</h3>
            <p>{firstName} {lastName}</p>
          </div>
          <div className="flex gap-2">
            <h3 className="text-muted-foreground">Usuario:</h3>
            <p className="text-clip">{username}</p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-center gap-2">
          <h3 className="text-muted-foreground">Email:</h3>
          <p>{email}</p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center">
        <Badge className={cn(
          'text-[10px]',
          isActive ? "bg-emerald-500" : "bg-rose-500"
        )}>
          {isActive ? "ACTIVO" : "INACTIVO"}
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default PersonalInfoCard
