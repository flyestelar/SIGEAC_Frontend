"use client";
import { useCreateWorkshop } from "@/actions/sistema/empresas/talleres/actions";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGetLocationsByCompany } from "@/hooks/sistema/useGetLocationsByCompany";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../ui/button";

const formSchema = z.object({
    name: z.string().min(3, {
        message: "El nombre debe tener al menos 3 carácters.",
    }),
    location_id: z.string().min(1, {
        message: "Debe eligir una ubicación.",
    }),
});

interface FormProps {
    onClose: () => void;
}

export default function CreateWorkshopForm({ onClose }: FormProps) {
    const { createWorkshop } = useCreateWorkshop();
    const { data: locations, isLoading: isLocationsLoading, isError: isLocationsError } = useGetLocationsByCompany()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });
    const { control } = form;
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        await createWorkshop.mutateAsync(values)
        onClose()
    };
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Taller</FormLabel>
                            <FormControl>
                                <Input placeholder="EJ: Taller de Frenos, etc..." {...field} />
                            </FormControl>
                            <FormDescription>
                                Este será el nombre de su taller.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="location_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ubicación</FormLabel>
                            <Select disabled={isLocationsError || isLocationsLoading} onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione una ubicación..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {
                                        locations && locations.map((location) => (
                                            <SelectItem key={location.id} value={location.id.toString()}>{location.address} - {location.cod_iata}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            <FormDescription>Este sera el tipo de su banco.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    className="bg-primary mt-2 text-white hover:bg-blue-900 disabled:bg-primary/70"
                    disabled={createWorkshop?.isPending}
                    type="submit"
                >
                    {createWorkshop?.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <p>Crear</p>
                    )}
                </Button>
            </form>
        </Form>
    );
}
