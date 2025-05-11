import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, FileText, Users, Lightbulb } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <ShieldAlert className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold">Complaint Central</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Login
          </Link>
          <Button asChild>
            <Link href="/register" prefetch={false}>Register</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-primary/10 via-background to-accent/10">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col items-center text-center justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    Streamline Your Complaint Management
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Complaint Central offers a robust platform for customers to voice concerns and for businesses to
                    manage, track, and resolve issues efficiently. Powered by AI for smarter triage.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/register" prefetch={false}>Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login" prefetch={false}>Login Now</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/seed/complaintapp/600/500"
                width="600"
                height="500"
                alt="Complaint Management Illustration"
                data-ai-hint="customer service illustration"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-lg"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why Choose Complaint Central?</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed with both customers and administrators in mind, ensuring a seamless experience from submission to resolution.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <FileText className="w-8 h-8 text-accent" />
                  <CardTitle>Easy Submission</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Customers can easily file complaints, attach documents, and select categories.</CardDescription>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Users className="w-8 h-8 text-accent" />
                  <CardTitle>Role-Based Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Secure access for customers, admins, and engineers with tailored dashboards.</CardDescription>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Lightbulb className="w-8 h-8 text-accent" />
                  <CardTitle>AI-Powered Triage</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Intelligent suggestions for complaint category and priority to speed up resolution.</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Complaint Central. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
