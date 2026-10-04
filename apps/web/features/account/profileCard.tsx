import { Card, CardContent } from "@/components/ui/card";

export const ProfileCard = () => (
  <Card className="bg-card text-center overflow-hidden border-border/60">
    <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
    <CardContent className="relative pt-0 px-6 pb-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full border-4 border-card bg-secondary overflow-hidden -mt-10">
          {/* تصویر شبیه‌ساز آواتار کاربر */}
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            DB
          </div>
        </div>
      </div>

      <h3 className="mt-3 font-bold text-foreground text-lg">
        نام کاربری
      </h3>
     

      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        سطح انفرادی
      </div>

      <div className="mt-6 p-4 bg-muted/30 border border-border/40 rounded-xl flex flex-col items-center justify-center gap-2">
        <div className="w-28 h-28 bg-white p-2 rounded-lg border border-border/50 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-1 w-full h-full opacity-70">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${i % 3 === 0 || i % 5 === 0 ? "bg-black" : "bg-transparent"}`}
              />
            ))}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1">
          اسکن برای ورود سریع با شناسنامه
        </span>
      </div>
    </CardContent>
  </Card>
);
