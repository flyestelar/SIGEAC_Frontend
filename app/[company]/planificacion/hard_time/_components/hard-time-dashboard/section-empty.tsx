import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type SectionEmptyProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function SectionEmpty({ title, description, action }: SectionEmptyProps) {
  return (
    <Card className="border-dashed border-border/70">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="rounded-full border border-border/60 bg-muted/30 p-3">
          <AlertCircle className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
