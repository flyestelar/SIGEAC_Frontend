import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { User } from "@/types/user"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
const PersonalInfoCard = ({user}: {
    user: User
}) => {
  return (
    <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
                Resumen personal de {user.first_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-around gap-2">
                <div className="flex gap-2">
                    <h3 className="text-muted-foreground">Nombre:</h3>
                    <p>Taylor Swift</p>
                </div>
                <div className="flex gap-2">
                    <h3 className="text-muted-foreground">Usuario:</h3>
                    <p className="text-clip">{user.username}</p>
                </div>
            </div>
            <Separator />
            <div className="flex justify-center gap-2">
                <h3 className="text-muted-foreground">Email:</h3>
                <p>{user.email}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Badge className={cn('text-[10px]', user.isActive.toString() === '1' ? "bg-emerald-500" : "bg-rose-500")}>{user.isActive.toString() === '1' ? "ACTIVO" :  "INACTIVO"}</Badge>
          </CardFooter>
        </Card>
  )
}

export default PersonalInfoCard