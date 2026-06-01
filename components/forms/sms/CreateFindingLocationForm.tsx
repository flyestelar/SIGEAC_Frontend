"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateFindingLocation } from "@/hooks/sms/useGetFindingLocations";
import { useCompanyStore } from "@/stores/CompanyStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
});

type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  onClose: () => void;
}

export function CreateFindingLocationForm({ onClose }: FormProps) {
  const { selectedCompany } = useCompanyStore();
  const createLocation = useCreateFindingLocation();

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: FormSchemaType) => {
    await createLocation.mutateAsync({ company: selectedCompany!.slug, name: data.name });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del lugar</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Pista de aterrizaje" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createLocation.isPending}>
          {createLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear lugar"}
        </Button>
      </form>
    </Form>
  );
}
