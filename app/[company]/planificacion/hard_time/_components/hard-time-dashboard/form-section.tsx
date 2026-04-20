import { ClipboardList } from 'lucide-react';

type FormSectionProps = {
  icon: typeof ClipboardList;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function FormSection({ icon: Icon, title, description, children }: FormSectionProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg border border-border/60 bg-background p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
