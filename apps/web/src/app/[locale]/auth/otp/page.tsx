"use client";
import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
const OtpInput = dynamic(() => import("@/components/auth/otpInput"), {
  ssr: false,
});

export default function AuthPage() {
  const [timer, setTimer] = useState(0);
  const [showOtp, setShowOtp] = useState(false);
  const locale = useLocale();
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);
  const handleSendOtp = () => {
    setShowOtp(true);
    setTimer(60);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="relative">
              <CardTitle>
                {showOtp ? "تایید کد" : "ورود از طریق رمز یکبار مصرف"}
              </CardTitle>
              {showOtp && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowOtp(false)}
                  className="absolute inset-e-4 p-1 rounded-md hover:bg-muted transition"
                >
                  {locale == "fa" ? (
                    <ArrowLeft className="w-5 h-5" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </Button>
              )}
              <CardDescription>
                {showOtp
                  ? "کد ۶ رقمی ارسال شده را وارد کنید"
                  : "شماره موبایل خود را وارد کنید"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!showOtp && (
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره موبایل</Label>
                  <Input id="phone" type="tel" placeholder="09..." />
                </div>
              )}

              {showOtp && (
                <div className="min-h-12 flex items-center justify-center">
                  <OtpInput
                    onComplete={(code) => {
                      console.log("OTP:", code);
                    }}
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-y-3">
              {!showOtp ? (
                <Fragment>
                  <Button className="w-full" onClick={handleSendOtp}>
                    ارسال رمز
                  </Button>
                  <Link href="/auth" className="block w-full">
                    <Button variant="outline" className="w-full">
                      ورود کلاسیک
                    </Button>
                  </Link>
                </Fragment>
              ) : (
                <Fragment>
                  <Button className="w-full">تایید</Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={timer > 0}
                    onClick={handleSendOtp}
                  >
                    {timer > 0 ? `ارسال مجدد (${timer})` : "ارسال مجدد"}
                  </Button>
                </Fragment>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="hidden md:flex flex-1 relative bg-muted items-center justify-center overflow-hidden">
        <Image
          src="/images/auth.png"
          alt="Authentication Background"
          fill
          priority
          // sizes="100vw"
          className="absolute inset-0 object-cover"
        />
      </div>
    </div>
  );
}
