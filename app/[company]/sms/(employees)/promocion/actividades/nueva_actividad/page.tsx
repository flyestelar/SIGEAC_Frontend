"use client";

import CreateSMSActivityForm from "@/components/forms/sms/CreateSMSActivityForm";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useSearchParams } from "next/navigation";
import { SmsActivityResource } from "@api/types.gen";

const CreateSMSActivity = () => {
  const searchParams = useSearchParams();
  const measureId = searchParams.get("measure_id");

  const initialData = measureId
    ? ({ mitigation_measure_id: Number(measureId) } as SmsActivityResource)
    : undefined;

  return (
    <ContentLayout title="Creacion de Actividad SMS">
      <div className="">
        <CreateSMSActivityForm
          onClose={() => false}
          initialData={initialData}
        />
      </div>
    </ContentLayout>
  );
};

export default CreateSMSActivity;
