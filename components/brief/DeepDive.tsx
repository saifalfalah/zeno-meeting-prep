import React from "react";
import { Card } from "@/components/ui/Card";

export interface DeepDiveProps {
  whatTheyDo: string | null;
  painPoints: string | null;
  howWeFit: string | null;
}

export function DeepDive({ whatTheyDo, painPoints, howWeFit }: DeepDiveProps) {
  return (
    <div className="space-y-4 mb-6">
      <Card className="p-6" data-section="what-they-do">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          What They Do
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {whatTheyDo || "Unknown"}
        </p>
      </Card>

      <Card className="p-6" data-section="pain-points">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Likely Pain Points
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {painPoints || "Unknown"}
        </p>
      </Card>

      <Card className="p-6" data-section="how-we-fit">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          How We Fit
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {howWeFit || "Unknown"}
        </p>
      </Card>
    </div>
  );
}
