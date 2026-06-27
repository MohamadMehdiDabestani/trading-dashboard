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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function AuthPage() {
  return (
    <div>
      <div className="min-h-screen w-full flex flex-col md:flex-row">
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
          <div className="w-full max-w-md">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">ورود</TabsTrigger>
                <TabsTrigger value="register">ثبت نام</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>خوش آمدید</CardTitle>
                    <CardDescription>
                      برای ورود به حساب کاربری خود، اطلاعات زیر را وارد کنید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-login">شماره همراه</Label>
                      <Input
                        id="phone-login"
                        type="email"
                        placeholder="09..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-login">رمز عبور</Label>
                      <Input  id="password-login" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-y-3">
                    <Button className="w-full">ورود</Button>
                    <Link href="/auth/otp" className="block w-full">
                      <Button variant="outline" className="w-full" color="secondary">
                        ورود آسان
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* فرم ثبت نام */}
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>ساخت حساب جدید</CardTitle>
                    <CardDescription>
                      اطلاعات خود را برای ایجاد حساب کاربری وارد کنید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">نام و نام خانوادگی</Label>
                      <Input id="name" placeholder="علی احمدی" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone-register">شماره تماس</Label>
                      <Input
                        id="phone-register"
                        type="text"
                        inputMode="numeric"
                        placeholder="09..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-register">رمز عبور</Label>
                      <Input id="password-register" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-y-3">
                    <Button className="w-full">ثبت نام</Button>
                    <Link href="/auth/otp" className="block w-full">
                      <Button variant="outline" className="w-full"  color="secondary">
                        ثبت نام آسان
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="hidden md:flex flex-1 relative bg-muted items-center justify-center overflow-hidden">
          <Image
            src="/images/auth.png"
            alt="Authentication Background"
            fill
            priority
            sizes="50vw"
            className="absolute inset-0 object-cover"
          />
        </div>
      </div>
      <Input placeholder="d" dir="auto" />
    </div>
  );
}
