"use client";

import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CalendarIcon } from "lucide-react";
import { es } from "date-fns/locale";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { Separator } from "@radix-ui/react-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAnalysis } from "@/actions/sms/analisis/actions";
import RiskMatrix from "../misc/RiskMatrix";

const FormSchema = z.object({
  severity: z.enum(["A", "B", "C", "D", "E"]),
  probability: z.enum(["1", "2", "3", "4", "5"]),
});

type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  id: string | number;
  name: string;
  onClose: () => void;
}

export default function CreateAnalysisForm({ onClose, id, name }: FormProps) {
  const { createAnalysis } = useCreateAnalysis();

  const SEVERITY = [
    { name: "CATASTROFICO", value: "A" },
    { name: "PELIGROSO", value: "B" },
    { name: "GRAVE", value: "C" },
    { name: "LEVE", value: "D" },
    { name: "INSIGNIFICANTE", value: "E" },
  ];

  const PROBABILITY = [
    { name: "FRECUENTE", value: "5" },
    { name: "OCASIONAL", value: "4" },
    { name: "REMOTO", value: "3" },
    { name: "IMPROBABLE", value: "2" },
    { name: "EXTREMADAMENTE_IMPROBABLE", value: "1" },
  ];
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {},
  });

  const onSubmit = async (data: FormSchemaType) => {
    id = id.toString();
    if (name === "mitigacion") {
      const values = {
        ...data,
        result: data.probability + data.severity,
        mitigation_plan_id: id,
      };
      console.log(values);
      await createAnalysis.mutateAsync(values);
    } else {
      const values = {
        ...data,
        result: data.probability + data.severity,
        danger_identification_id: id,
      };
      console.log(values);
      await createAnalysis.mutateAsync(values);
    }
    onClose();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-3"
      >
        <FormLabel className="text-lg text-center m-2">
          Análisis del peligro
        </FormLabel>

        <FormField
          control={form.control}
          name="probability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Probabilidad del riesgo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar probabilidad de riesgo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROBABILITY.map((probability, index) => (
                    <SelectItem key={index} value={probability.value}>
                      {probability.name} ({probability.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Elegir la probabilidad del riesgo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="severity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Severidad del riesgo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar severidad del peligro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SEVERITY.map((severity, index) => (
                    <SelectItem key={index} value={severity.value}>
                      {severity.name} ({severity.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Elegir la severidad del riesgo</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <RiskMatrix></RiskMatrix>
        <div className="flex justify-between items-center gap-x-4">
          <Separator className="flex-1" />
          <p className="text-muted-foreground">SIGEAC</p>
          <Separator className="flex-1" />
        </div>
        <Button>Enviar reporte</Button>
      </form>
    </Form>
  );
}
