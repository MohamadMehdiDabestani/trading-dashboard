"use client";

import { Fragment } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuccessRateCard } from "@/features/dashboard/components/successRateCard";
import { PortfolioCard } from "@/features/dashboard/components/portfolioCard";
import { BalanceCard } from "@/features/dashboard/components/balanceCard";
import { MarketWatchCard } from "@/features/dashboard/components/marketWatch";
import { OrdersPanel } from "@/features/dashboard/components/orederPanel";

export default function DashboardPage() {
  return (
    <Fragment>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
        <SuccessRateCard />
        <PortfolioCard />
        <BalanceCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        <div className="lg:col-span-4 space-y-6">
          <MarketWatchCard />
        </div>

        <div className="lg:col-span-8">
          <Card>
            <Tabs defaultValue="history" className="w-full">
              <CardHeader className="p-0 border-b">
                <TabsList className="w-full justify-start rounded-none bg-transparent h-12 p-0">
                  <TabsTrigger
                    value="history"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent"
                  >
                    تاریخچه معاملات
                  </TabsTrigger>
                  <TabsTrigger
                    value="orders"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent"
                  >
                    سفارشات باز
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value="orders" className="m-0">
                  <OrdersPanel kind="open" />
                </TabsContent>
                <TabsContent value="history" className="m-0">
                  <OrdersPanel kind="history" />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </Fragment>
  );
}
