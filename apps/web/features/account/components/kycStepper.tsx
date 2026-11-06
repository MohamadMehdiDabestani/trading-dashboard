"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTrigger,
} from "@/components/ui/stepper";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, MapPin, User, Diamond, Check } from "lucide-react";

export function KYCStepper() {
  const t = useTranslations("account.kyc");
  const [activeStep, setActiveStep] = useState(3);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const orientation = isMobile ? "vertical" : "horizontal";

  const steps = [
    {
      step: 1,
      title: t("steps.bronze.title"),
      description: t("steps.bronze.description"),
      content: t("steps.bronze.content"),
    },
    {
      step: 2,
      title: t("steps.silver.title"),
      description: t("steps.silver.description"),
      content: t("steps.silver.content"),
    },
    {
      step: 3,
      title: t("steps.gold.title"),
      description: t("steps.gold.description"),
      content: t("steps.gold.content"),
    },
    {
      step: 4,
      title: t("steps.vip.title"),
      description: t("steps.vip.description"),
      content: t("steps.vip.content"),
    },
  ];

  return (
    <Card className="bg-card border-border/60">
      <CardContent className="pt-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-start">
              <h3 className="font-extrabold text-foreground text-md">
                {t("title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("description")}
              </p>
            </div>
          </div>
        </div>

        <Stepper
          value={activeStep}
          onValueChange={setActiveStep}
          orientation={orientation}
          indicators={{
            active: <User className="h-4 w-4" />,
            completed: <Check className="h-4 w-4" />,
            inactive: <MapPin className="h-4 w-4" />,
            loading: <Diamond className="h-4 w-4 animate-pulse" />,
          }}
        >
          <StepperNav
            className={`items-start ms-[10%] ${
              orientation === "horizontal" ? "w-full" : "flex-col gap-4"
            }`}
          >
            {steps.map((item, index) => {
              const completed = item.step < activeStep;
              const current = item.step === activeStep;
              const inactive = item.step > activeStep;

              return (
                <StepperItem
                  key={item.step}
                  step={item.step}
                  completed={completed}
                  className={
                    orientation === "horizontal"
                      ? "flex-1 flex flex-row items-start"
                      : "w-full"
                  }
                >
                  <StepperTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-col items-center text-center gap-2"
                    >
                      <StepperIndicator className="h-10 w-10 shrink-0 rounded-full border border-border/60 bg-background text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground flex items-center justify-center">
                        {completed ? (
                          <Check className="h-4 w-4" />
                        ) : current ? (
                          <User className="h-4 w-4" />
                        ) : (
                          item.step
                        )}
                      </StepperIndicator>

                      <div className="space-y-1">
                        <div
                          className={`text-xs font-bold ${
                            inactive ? "text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  </StepperTrigger>

                  {(orientation === "horizontal" ||
                    index !== steps.length - 1) && (
                    <StepperSeparator
                      className={
                        orientation === "horizontal"
                          ? `mt-5 flex-1 bg-border/60 data-[state=completed]:bg-primary ${
                              index === steps.length - 1 ? "invisible" : ""
                            }`
                          : "bg-border/60 data-[state=completed]:bg-primary"
                      }
                    />
                  )}
                </StepperItem>
              );
            })}
          </StepperNav>

          <StepperPanel className="mt-6">
            {steps.map((item) => (
              <StepperContent key={item.step} value={item.step}>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  {item.content}
                </div>
              </StepperContent>
            ))}
          </StepperPanel>
        </Stepper>
      </CardContent>
    </Card>
  );
}