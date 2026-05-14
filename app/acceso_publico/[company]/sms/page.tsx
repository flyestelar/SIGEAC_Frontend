"use client";
import { CustomCard } from "@/components/cards/CustomCard";
import { PolicyCard } from "@/components/cards/PolicyCard";
import ActionPlanDialog from "@/components/dialogs/sms/ActionPlanDialog";
import FeaturesDialog from "@/components/dialogs/sms/FeaturedDialog";
import { SMSConceptsDialog } from "@/components/dialogs/sms/SMSConceptsDialog";
import { ImageGalleryDialog } from "@/components/dialogs/general/ImageGalleryDialog";
import { GuestContentLayout } from "@/components/layout/GuestContentLayout";
import { MissionVision } from "@/components/misc/MissionVision";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetSurveySettingNumbers } from "@/hooks/sms/survey/useGetSurveySettingNumbers";
import {
  emergencyPlans,
  policyCardsData,
  policyImages,
  smsConcepts,
} from "@/lib/contants/sms-data";
import {
  FileText,
  Shield,
  Building,
  Target,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Newspaper,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const SMSPage = () => {
  const params = useParams();
  const company = params.company as string;
  const router = useRouter();
  const [isConceptOpen, setIsConceptOpen] = useState(false);
  const { data: surveyNumbers } = useGetSurveySettingNumbers(company);

  const SMSresponsibilities = [
    {
      image: `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}sms/images/promotions/risk_icon.png`,
      title: "Responsabilidades SMS Dueños de Proceso",
      items: [
        "Mitigar los Riesgos",
        "Participar en los Simulacros de Emergencias",
        "Participar en las Actividades de SMS",
        "Contar con los Conocimientos de las Politicas",
      ],
    },
    {
      image: `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}sms/images/promotions/caution.png`,
      title: "Responsabilidades SMS Resto del Personal",
      items: [
        "Identificar Peligros",
        "Participar en los Simulacros de Emergencias",
        "Participar en las Actividades de SMS",
        "Contar con los Conocimientos de las Politicas",
      ],
    },
  ];

  const strategyItems = [
    {
      key: "conceptos",
      icon: BookOpen,
      label: "Términos SMS",
      desc: "Conceptos y definiciones esenciales del Sistema de Gestión de Seguridad.",
      accentClass: "border-l-sky-500",
      iconBg: "bg-sky-50 dark:bg-sky-950",
      iconColor: "text-sky-600",
      actionLabel: "Consultar",
      actionColor: "text-sky-600",
    },
    {
      key: "responsabilidades",
      icon: Shield,
      label: "Responsabilidades SMS",
      desc: "Responsabilidades del personal en materia de seguridad operacional.",
      accentClass: "border-l-amber-500",
      iconBg: "bg-amber-50 dark:bg-amber-950",
      iconColor: "text-amber-600",
      actionLabel: "Ver más",
      actionColor: "text-amber-600",
    },
    {
      key: "encuesta",
      icon: CheckCircle2,
      label: "Encuestas SMS",
      desc: "Evalúa tus conocimientos sobre el Sistema de Gestión de Seguridad.",
      accentClass: "border-l-emerald-500",
      iconBg: "bg-emerald-50 dark:bg-emerald-950",
      iconColor: "text-emerald-600",
      actionLabel: "Participar",
      actionColor: "text-emerald-600",
    },
    {
      key: "trivia",
      icon: Target,
      label: "Trivia SMS",
      desc: "Pon a prueba tus conocimientos en materia de SMS.",
      accentClass: "border-l-violet-500",
      iconBg: "bg-violet-50 dark:bg-violet-950",
      iconColor: "text-violet-600",
      actionLabel: "Jugar",
      actionColor: "text-violet-600",
    },
    {
      key: "comunicados",
      icon: Newspaper,
      label: "Comunicados SMS",
      desc: "Boletines e información institucional relacionada con SMS.",
      accentClass: "border-l-rose-500",
      iconBg: "bg-rose-50 dark:bg-rose-950",
      iconColor: "text-rose-600",
      actionLabel: "Ver comunicados",
      actionColor: "text-rose-600",
    },
  ];

  return (
    <GuestContentLayout title="Seguridad Operacional SMS">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .sms-display { font-family: 'Barlow Condensed', sans-serif; letter-spacing: -0.01em; }
        .sms-body   { font-family: 'Inter', sans-serif; }
        .sms-stat-divider:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.12); }
        @keyframes sms-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sms-rise   { animation: sms-rise 0.55s ease forwards; }
        .sms-rise-2 { animation: sms-rise 0.55s ease 0.12s forwards; opacity: 0; }
        .sms-strategy-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .sms-strategy-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.10); }
        .sms-tabs-list::-webkit-scrollbar { display: none; }
        .sms-tabs-list { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="sms-body flex flex-col w-full max-w-6xl mx-auto gap-6 sm:gap-8">

        {/* ── HERO ── */}
        <section className="relative rounded-2xl overflow-hidden shadow-2xl sms-rise">
          {/* Background */}
          <div className="absolute inset-0">
            <Image
              src={`${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}images/sms/estelar_technik.png`}
              alt="Estelar Technik"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/75" />
          </div>

          {/* Content */}
          <div className="relative z-10 px-4 sm:px-8 pt-6 sm:pt-10 pb-0 lg:px-14 lg:pt-14 min-h-[360px] flex flex-col">
            {/* Status pill */}
            <div className="flex items-center gap-2 mb-4 sm:mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
              </span>
              <span className="text-sky-400 text-[11px] font-semibold tracking-[0.22em] uppercase">
                Portal Activo · Seguridad Operacional
              </span>
            </div>

            {/* Title */}
            <div className="flex-1 max-w-2xl">
              <h1 className="sms-display text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-none mb-3 sm:mb-4 uppercase">
                Sistema de Gestión de{" "}
                <span className="text-sky-400">Seguridad</span>{" "}
                Operacional
              </h1>
              <p className="text-slate-300 text-sm lg:text-base leading-relaxed max-w-lg mb-4 sm:mb-8">
                Comprometidos con los más altos estándares de seguridad en
                todas nuestras operaciones de aviación.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() =>
                    router.push(
                      `/acceso_publico/${company}/sms/crear_reporte/voluntario`
                    )
                  }
                  className="group bg-sky-500 hover:bg-sky-400 text-white border-0 px-6 h-11 text-sm font-semibold shadow-lg shadow-sky-500/25 transition-all duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Reporte Voluntario
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-150" />
                </Button>
                <Button
                  onClick={() =>
                    router.push(
                      `/acceso_publico/${company}/sms/crear_reporte/obligatorio`
                    )
                  }
                  className="bg-white/10 border border-white/40 text-white hover:bg-white/20 hover:border-white/60 px-6 h-11 text-sm font-semibold backdrop-blur-sm transition-all duration-200"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Reporte Obligatorio
                </Button>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-6 sm:mt-10 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4">
              {[
                { value: "6",    label: "Planes de Emergencia" },
                { value: "4",    label: "Áreas Estratégicas" },
                { value: "100%", label: "Compromiso Operacional" },
                { value: "24/7", label: "Gestión Continua" },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`sms-stat-divider text-center py-3 sm:py-5 ${i < 3 ? "sm:border-r sm:border-white/12" : ""}`}
                >
                  <div className="sms-display text-2xl sm:text-3xl lg:text-4xl font-bold text-sky-400">{s.value}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TABS ── */}
        <Tabs defaultValue="politicas" className="w-full sms-rise-2">
          <div className="sms-tabs-list relative border-b border-border overflow-x-auto">
            <TabsList className="w-max min-w-full bg-transparent border-none rounded-none h-auto p-0 flex gap-0">
              {[
                { value: "politicas",     icon: BookOpen,       label: "Políticas" },
                { value: "empresa",       icon: Building,       label: "Empresa" },
                { value: "estrategias",   icon: Target,         label: "Estrategias" },
                { value: "plan-respuesta",icon: AlertTriangle,  label: "Plan de Respuesta" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="shrink-0 flex items-center justify-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4 text-sm font-medium text-muted-foreground transition-colors duration-200 whitespace-nowrap"
                >
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── POLÍTICAS ── */}
          <TabsContent value="politicas" className="mt-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="sms-display text-xl sm:text-2xl font-bold uppercase tracking-wide">
                  Políticas de Seguridad Operacional
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Compromisos institucionales en materia de seguridad
                </p>
              </div>
              <ImageGalleryDialog
                images={policyImages}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-sky-400 text-sky-600 hover:bg-sky-50 gap-2 shrink-0"
                  >
                    <BookOpen className="w-4 h-4" />
                    Ver Políticas Completas
                  </Button>
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policyCardsData.map((policy, index) => (
                <PolicyCard
                  key={index}
                  index={index}
                  icon={policy.icon}
                  title=""
                  description={policy.description}
                  className="hover:border-sky-200 hover:shadow-sm transition-all duration-200"
                />
              ))}
            </div>
          </TabsContent>

          {/* ── EMPRESA ── */}
          <TabsContent value="empresa" className="mt-6 space-y-5">
            <div>
              <h2 className="sms-display text-xl sm:text-2xl font-bold uppercase tracking-wide">
                Nuestra Empresa
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Misión, visión e identidad corporativa
              </p>
            </div>

            <MissionVision />

            <div className="relative rounded-xl overflow-hidden border border-border">
              <Image
                src={`${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}sms/images/promotions/sms_airplane_page.jpg`}
                alt="Instalaciones Estelar Technik"
                width={1200}
                height={500}
                className="w-full object-cover max-h-72 hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-5 text-white">
                <p className="text-sm font-semibold">Instalaciones Operacionales</p>
                <p className="text-xs opacity-70 uppercase tracking-widest">{company}</p>
              </div>
            </div>
          </TabsContent>

          {/* ── ESTRATEGIAS ── */}
          <TabsContent value="estrategias" className="mt-6 space-y-5">
            {/* Controlled dialog rendered outside grid */}
            <SMSConceptsDialog
              concepts={smsConcepts}
              title="Glosario de Términos SMS"
              description="Definiciones esenciales para comprender el Sistema de Gestión de Seguridad"
              open={isConceptOpen}
              onOpenChange={setIsConceptOpen}
            />

            <div>
              <h2 className="sms-display text-xl sm:text-2xl font-bold uppercase tracking-wide">
                Estrategias de Seguridad Operacional
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Recursos y herramientas para fortalecer la cultura de seguridad
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Términos SMS */}
              <div
                className={`sms-strategy-card cursor-pointer group`}
                onClick={() => setIsConceptOpen(true)}
              >
                <Card className={`h-full border-l-4 ${strategyItems[0].accentClass}`}>
                  <CardContent className="p-5">
                    <div className={`w-9 h-9 rounded-lg ${strategyItems[0].iconBg} flex items-center justify-center mb-3`}>
                      <BookOpen className={`w-5 h-5 ${strategyItems[0].iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{strategyItems[0].label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{strategyItems[0].desc}</p>
                    <div className={`mt-3 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all ${strategyItems[0].actionColor}`}>
                      <span>{strategyItems[0].actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Responsabilidades SMS */}
              <FeaturesDialog features={SMSresponsibilities}>
                <div className="sms-strategy-card cursor-pointer group">
                  <Card className={`h-full border-l-4 ${strategyItems[1].accentClass}`}>
                    <CardContent className="p-5">
                      <div className={`w-9 h-9 rounded-lg ${strategyItems[1].iconBg} flex items-center justify-center mb-3`}>
                        <Shield className={`w-5 h-5 ${strategyItems[1].iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{strategyItems[1].label}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{strategyItems[1].desc}</p>
                      <div className={`mt-3 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all ${strategyItems[1].actionColor}`}>
                        <span>{strategyItems[1].actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </FeaturesDialog>

              {/* Encuestas SMS */}
              <div
                className={`sms-strategy-card ${surveyNumbers?.SMS_SURVEY ? "cursor-pointer group" : "opacity-50"}`}
                onClick={() => {
                  if (surveyNumbers?.SMS_SURVEY) {
                    router.push(`/acceso_publico/${company}/sms/encuesta/${surveyNumbers.SMS_SURVEY}`);
                  }
                }}
              >
                <Card className={`h-full border-l-4 ${strategyItems[2].accentClass}`}>
                  <CardContent className="p-5">
                    <div className={`w-9 h-9 rounded-lg ${strategyItems[2].iconBg} flex items-center justify-center mb-3`}>
                      <CheckCircle2 className={`w-5 h-5 ${strategyItems[2].iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{strategyItems[2].label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{strategyItems[2].desc}</p>
                    {surveyNumbers?.SMS_SURVEY && (
                      <div className={`mt-3 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all ${strategyItems[2].actionColor}`}>
                        <span>{strategyItems[2].actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Trivia SMS */}
              <div
                className={`sms-strategy-card ${surveyNumbers?.SMS_QUIZ ? "cursor-pointer group" : "opacity-50"}`}
                onClick={() => {
                  if (surveyNumbers?.SMS_QUIZ) {
                    router.push(`/acceso_publico/${company}/sms/encuesta/${surveyNumbers.SMS_QUIZ}`);
                  }
                }}
              >
                <Card className={`h-full border-l-4 ${strategyItems[3].accentClass}`}>
                  <CardContent className="p-5">
                    <div className={`w-9 h-9 rounded-lg ${strategyItems[3].iconBg} flex items-center justify-center mb-3`}>
                      <Target className={`w-5 h-5 ${strategyItems[3].iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{strategyItems[3].label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{strategyItems[3].desc}</p>
                    {surveyNumbers?.SMS_QUIZ && (
                      <div className={`mt-3 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all ${strategyItems[3].actionColor}`}>
                        <span>{strategyItems[3].actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Comunicados SMS */}
              <div
                className="sms-strategy-card cursor-pointer group"
                onClick={() => router.push(`/acceso_publico/${company}/sms/comunicados`)}
              >
                <Card className={`h-full border-l-4 ${strategyItems[4].accentClass}`}>
                  <CardContent className="p-5">
                    <div className={`w-9 h-9 rounded-lg ${strategyItems[4].iconBg} flex items-center justify-center mb-3`}>
                      <Newspaper className={`w-5 h-5 ${strategyItems[4].iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{strategyItems[4].label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{strategyItems[4].desc}</p>
                    <div className={`mt-3 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all ${strategyItems[4].actionColor}`}>
                      <span>{strategyItems[4].actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── PLAN DE RESPUESTA ── */}
          <TabsContent value="plan-respuesta" className="mt-6 space-y-5">
            <div>
              <h2 className="sms-display text-xl sm:text-2xl font-bold uppercase tracking-wide">
                Plan de Respuesta Ante la Emergencia
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Procedimientos de actuación en situaciones de emergencia ·{" "}
                <span className="uppercase font-medium">{company}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyPlans.map((plan, index) => (
                <ActionPlanDialog
                  key={index}
                  title={`${plan.cardData?.stepsTitle || plan.cardData?.title}`}
                  actionSteps={plan.actionSteps}
                >
                  <div className="cursor-pointer hover:scale-[1.02] transition-transform duration-200">
                    <CustomCard
                      imageUrl={plan.cardData.imageUrl}
                      imageAlt={plan.cardData.imageAlt}
                      title={plan.cardData.title}
                      description={plan.cardData.description}
                      actionLink={plan.cardData.actionLink}
                      className="h-full"
                    />
                  </div>
                </ActionPlanDialog>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </GuestContentLayout>
  );
};

export default SMSPage;
