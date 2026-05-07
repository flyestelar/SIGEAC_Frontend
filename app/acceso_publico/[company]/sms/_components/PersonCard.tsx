import React from 'react';
import Image from 'next/image';
import { Card } from "@/components/ui/card";

interface PersonProps {
    role: string;
    image: string;
    description: string;
}

export const PersonCard = ({ role, image, description }: PersonProps) => {
    return (
        <Card className="relative overflow-hidden bg-transparent border border-transparent shadow-sm transition-shadow duration-200 hover:shadow-md">
            {/* Responsive: stack on small screens, two columns on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-0 min-h-[220px]">

                {/* IMAGE: principal foco. aparece primero en móvil */}
                <div className="flex items-center justify-center p-3 md:p-4 bg-transparent">
                    {/* Focusable wrapper so keyboard users land on the image */}
                    <div
                        tabIndex={0}
                        aria-label={`${role} image`}
                        className="relative w-full h-56 md:h-full rounded-lg overflow-hidden transition-transform transform focus:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300/40"
                    >
                        <Image
                            src={image}
                            alt={role}
                            fill
                            className="object-contain p-[1px] rounded-lg border border-yellow-500/20 shadow-sm"
                            priority
                        />
                    </div>
                </div>

                {/* INFO: minimalista, sin distracciones */}
                <div className="flex flex-col justify-center p-4 md:border-l md:border-border/10 bg-transparent">
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground leading-tight">
                            {role}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-tight max-w-prose">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};
