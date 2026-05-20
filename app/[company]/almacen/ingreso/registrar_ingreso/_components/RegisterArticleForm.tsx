'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ArticleFormProps } from '../_lib/types';
import CreateComponentForm from './CreateComponentForm';
import CreateConsumableForm from './CreateConsumableForm';
import CreateToolForm from './CreateToolForm';

interface RegisterArticleFormProps extends ArticleFormProps {
  category?: string;
}

const RegisterArticleForm = ({ isEditing = false, initialData, category }: RegisterArticleFormProps) => {
  const [type, setType] = useState(
    initialData?.batches?.category?.toLowerCase() ?? category?.toLowerCase() ?? 'componente',
  );

  return (
    <div className="space-y-3 mb-4">
      <h1 className="font-bold text-3xl">{isEditing ? 'Confirmacion de Material' : 'Ingreso de Material'}</h1>
      {!isEditing && <p className="text-sm text-muted-foreground">Seleccione el tipo de Material a registrar:</p>}
      <Select disabled={isEditing} value={type} onValueChange={setType}>
        <SelectTrigger className="w-[230px]">
          <SelectValue placeholder="Seleccionar..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="consumible">Consumible</SelectItem>
          <SelectItem value="herramienta">Herramienta</SelectItem>
          <SelectItem value="componente">Componente</SelectItem>
        </SelectContent>
      </Select>
      {type === 'consumible' && <CreateConsumableForm isEditing={isEditing} initialData={initialData} />}
      {type === 'herramienta' && <CreateToolForm isEditing={isEditing} initialData={initialData} />}
      {type === 'componente' && <CreateComponentForm isEditing={isEditing} initialData={initialData} />}
    </div>
  );
};

export default RegisterArticleForm;
