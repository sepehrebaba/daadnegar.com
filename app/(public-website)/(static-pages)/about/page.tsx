import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { routes } from "@/lib/routes";

export default function AboutPage() {
  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Info className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">درباره دادنگار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-justify leading-relaxed">
            دادنگار یک پلتفرم امن برای گزارش‌دهی است. ما به شما کمک می‌کنیم تا بتوانید به صورت ناشناس
            و امن، گزارش‌های خود را ثبت کنید.
          </p>
          <p className="text-muted-foreground text-justify leading-relaxed">
            هدف ما ایجاد شفافیت و کمک به اجرای عدالت است. تمام اطلاعات شما با بالاترین سطح امنیت
            محافظت می‌شود.
          </p>
          <Link
            href={routes.home}
            className="border-border bg-background hover:bg-accent hover:text-accent-foreground ring-offset-background focus-visible:ring-ring mt-6 flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            بازگشت
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
